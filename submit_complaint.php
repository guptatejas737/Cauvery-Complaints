<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);

require_once '../confessions2/vendor/autoload.php';
require_once 'config.php';

header('Content-Type: application/json');

if (!isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Please log in first']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

try {
    $name = trim($_POST['name'] ?? '');
    $rollNo = trim($_POST['rollNo'] ?? '');
    $roomNo = trim($_POST['roomNo'] ?? '');
    $complaintBody = trim($_POST['complaintBody'] ?? '');
    $timestamp = $_POST['timestamp'] ?? date('Y-m-d H:i:s');
    
    if (empty($name) || empty($rollNo) || empty($roomNo) || empty($complaintBody)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }
    
    $words = str_word_count($complaintBody);
    if ($words < 9) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Complaint must contain at least 10 words']);
        exit;
    }
    
    // STRICT AI validation - no fallbacks
    $aiValidation = validateComplaintWithAI($complaintBody);
    
    if (!$aiValidation['valid']) {
        http_response_code(422);
        echo json_encode([
            'success' => false, 
            'message' => $aiValidation['reason']
        ]);
        exit;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO complaints (user_id, name, roll_no, room_no, complaint_body, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    
    $result = $stmt->execute([
        $_SESSION['user_id'],
        $name,
        $rollNo,
        $roomNo,
        $complaintBody
    ]);
    
    if ($result) {
        $complaintId = $pdo->lastInsertId();
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Complaint submitted successfully',
            'complaint_id' => $complaintId
        ]);
    } else {
        throw new Exception('Failed to insert complaint into database');
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

function validateComplaintWithAI($complaintText) {
    $apiKey = GROQ_API_KEY;
    $apiUrl = GROQ_API_URL;
    
    // STRICT: No API key = reject everything
    if (empty($apiKey) || empty($apiUrl)) {
        return ['valid' => false, 'reason' => 'AI validation service not configured'];
    }
    
    $data = [
        'model' => 'llama-3.1-8b-instant',
        'messages' => [
            [
                'role' => 'system',
                'content' => 'You are a complaint validator. Respond with ONLY "APPROVE" if the text is a legitimate hostel complaint about facilities inside the rooms (which include LAN, lights, fans, cupboards, beds, ports, wires, MCB etc.) / washrooms, maintenance, food, cleanliness, noise, or accommodation issues. Respond with "REJECT" for anything else including spam, tests, random text which you think is not related to complaints.'
            ],
            [
                'role' => 'user',
                'content' => 'Validate this complaint: ' . $complaintText
            ]
        ],
        'max_tokens' => 50,
        'temperature' => 0
    ];
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $apiUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $apiKey,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT => 15,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    // STRICT: Any API failure = reject
    if (curl_errno($ch)) {
        curl_close($ch);
        return ['valid' => false, 'reason' => 'Validation service unavailable'];
    }
    
    curl_close($ch);
    
    if ($httpCode !== 200) {
        return ['valid' => false, 'reason' => 'Validation service error'];
    }
    
    $result = json_decode($response, true);
    
    if (!$result || !isset($result['choices'][0]['message']['content'])) {
        return ['valid' => false, 'reason' => 'Invalid validation response'];
    }
    
    $aiResponse = strtoupper(trim($result['choices'][0]['message']['content']));
    
    // STRICT: Only "APPROVE" passes, everything else fails
    if (strpos($aiResponse, 'APPROVE') !== false) {
        return ['valid' => true, 'reason' => 'Approved by AI'];
    } else {
        return ['valid' => false, 'reason' => 'Complaint rejected by AI validation'];
    }
}
?>
