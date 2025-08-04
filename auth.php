<?php
require_once '../confessions2/vendor/autoload.php';
require_once 'config.php';

use Google\Client as Google_Client;
use Google\Service\Oauth2 as Google_Service_Oauth2;

// Handle OAuth callback
if (isset($_GET['code'])) {
    $client = new Google_Client();
    $client->setClientId(GOOGLE_CLIENT_ID);
    $client->setClientSecret(GOOGLE_CLIENT_SECRET);
    $client->setRedirectUri(GOOGLE_REDIRECT_URI);
    $client->addScope('email');
    $client->addScope('profile');
    
    try {
        // Exchange authorization code for access token
        $token = $client->fetchAccessTokenWithAuthCode($_GET['code']);
        
        if (isset($token['error'])) {
            throw new Exception('Token fetch failed: ' . $token['error']);
        }
        
        $client->setAccessToken($token);
        
        // Get user info
        $google_service = new Google_Service_Oauth2($client);
        $data = $google_service->userinfo->get();
        
        $email = $data->email;
        $name = $data->name;
        
        // Check if it's an IITM email
        if (!isIITMEmail($email)) {
            echo '<script>
                alert("Only IITM smail accounts are allowed!");
                window.location.href = "login.html";
            </script>';
            exit;
        }
        
        // Create or get user
        $user = createOrGetUser($email, $name);
        if ($user) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['user_name'] = $user['name'];
            
            // Redirect to dashboard
            header('Location: dashboard.html');
            exit;
        } else {
            echo '<script>
                alert("Failed to create user account!");
                window.location.href = "login.html";
            </script>';
        }
        
    } catch (Exception $e) {
        error_log('OAuth error: ' . $e->getMessage());
        echo '<script>
            alert("Authentication failed: ' . addslashes($e->getMessage()) . '");
            window.location.href = "login.html";
        </script>';
    }
    exit;
}

// Handle other actions (logout, check session)
header('Content-Type: application/json');

$action = $_GET['action'] ?? ($_POST['action'] ?? '');

switch ($action) {
    case 'logout':
        session_destroy();
        echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
        break;
        
    case 'check_session':
        if (isLoggedIn()) {
            echo json_encode([
                'logged_in' => true,
                'user' => [
                    'id' => $_SESSION['user_id'],
                    'email' => $_SESSION['user_email'],
                    'name' => $_SESSION['user_name']
                ]
            ]);
        } else {
            echo json_encode(['logged_in' => false]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

function createOrGetUser($email, $name) {
    global $pdo;
    
    try {
        // Check if user already exists
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            // Update name if changed
            if ($user['name'] !== $name) {
                $updateStmt = $pdo->prepare("UPDATE users SET name = ? WHERE id = ?");
                $updateStmt->execute([$name, $user['id']]);
                $user['name'] = $name;
            }
            return $user;
        } else {
            // Create new user
            $stmt = $pdo->prepare("INSERT INTO users (email, name) VALUES (?, ?)");
            if ($stmt->execute([$email, $name])) {
                $userId = $pdo->lastInsertId();
                return [
                    'id' => $userId,
                    'email' => $email,
                    'name' => $name
                ];
            }
        }
    } catch (PDOException $e) {
        error_log("Database error: " . $e->getMessage());
        return false;
    }
    
    return false;
}
?>
