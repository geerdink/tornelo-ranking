<?php
/**
 * WordPress Cron Job - Auto-update Tornelo Standings
 * 
 * Install via Code Snippets plugin:
 * 1. WordPress → Snippets → Add New
 * 2. Paste this code
 * 3. Set to "Run everywhere"
 * 4. Activate
 * 
 * This will:
 * - Fetch fresh data from your GitHub Pages URL every 2 hours
 * - Save to /wp-content/uploads/tornelo-data.json
 * - Widget automatically uses the updated file
 */

// Schedule the cron job (runs every 2 hours)
add_action('wp', 'tornelo_schedule_update');
function tornelo_schedule_update() {
    if (!wp_next_scheduled('tornelo_auto_update')) {
        wp_schedule_event(time(), 'twicehourly', 'tornelo_auto_update');
    }
}

// Register custom cron interval (every 2 hours)
add_filter('cron_schedules', 'tornelo_cron_interval');
function tornelo_cron_interval($schedules) {
    $schedules['twicehourly'] = array(
        'interval' => 7200, // 2 hours in seconds
        'display'  => __('Every 2 Hours')
    );
    return $schedules;
}

// The actual update function
add_action('tornelo_auto_update', 'tornelo_fetch_and_save');
function tornelo_fetch_and_save() {
    // OPTION 1: Fetch from GitHub Pages
    // After setup, your data will be at: https://YOUR-USERNAME.github.io/tornelo-ranking/tornelo-data.json
    $source_url = 'https://YOUR-USERNAME.github.io/tornelo-ranking/tornelo-data.json';
    
    // OPTION 2: Or fetch from GitHub raw file
    // $source_url = 'https://raw.githubusercontent.com/YOUR-USERNAME/tornelo-ranking/main/tornelo-data.json';
    
    // Fetch the data
    $response = wp_remote_get($source_url, array(
        'timeout' => 30,
        'sslverify' => true
    ));
    
    if (is_wp_error($response)) {
        error_log('Tornelo Update Error: ' . $response->get_error_message());
        return;
    }
    
    $status_code = wp_remote_retrieve_response_code($response);
    if ($status_code !== 200) {
        error_log('Tornelo Update Error: HTTP ' . $status_code);
        return;
    }
    
    $json_data = wp_remote_retrieve_body($response);
    
    // Validate JSON
    $data = json_decode($json_data);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('Tornelo Update Error: Invalid JSON');
        return;
    }
    
    // Get uploads directory
    $upload_dir = wp_upload_dir();
    $file_path = $upload_dir['basedir'] . '/tornelo-data.json';
    
    // Save the file
    $result = file_put_contents($file_path, $json_data);
    
    if ($result === false) {
        error_log('Tornelo Update Error: Could not write file');
        return;
    }
    
    error_log('Tornelo Update Success: ' . strlen($json_data) . ' bytes written');
}

// Add manual update button to admin dashboard (optional)
add_action('admin_menu', 'tornelo_add_admin_menu');
function tornelo_add_admin_menu() {
    add_management_page(
        'Tornelo Update',
        'Tornelo Update',
        'manage_options',
        'tornelo-update',
        'tornelo_admin_page'
    );
}

function tornelo_admin_page() {
    if (isset($_POST['tornelo_update_now']) && check_admin_referer('tornelo_update_action')) {
        tornelo_fetch_and_save();
        echo '<div class="notice notice-success"><p>Tornelo standings updated!</p></div>';
    }
    
    ?>
    <div class="wrap">
        <h1>Tornelo Standings Update</h1>
        <p>Automatic updates run every 2 hours via WordPress cron.</p>
        <form method="post">
            <?php wp_nonce_field('tornelo_update_action'); ?>
            <input type="submit" name="tornelo_update_now" class="button button-primary" value="Update Now">
        </form>
        
        <h2>Status</h2>
        <?php
        $upload_dir = wp_upload_dir();
        $file_path = $upload_dir['basedir'] . '/tornelo-data.json';
        
        if (file_exists($file_path)) {
            $mod_time = filemtime($file_path);
            $size = filesize($file_path);
            echo '<p><strong>Last updated:</strong> ' . date('Y-m-d H:i:s', $mod_time) . '</p>';
            echo '<p><strong>File size:</strong> ' . number_format($size) . ' bytes</p>';
            
            $data = json_decode(file_get_contents($file_path));
            if ($data && isset($data->standings)) {
                echo '<p><strong>Players:</strong> ' . count($data->standings) . '</p>';
            }
        } else {
            echo '<p style="color: red;">File not found. Click "Update Now" to create it.</p>';
        }
        
        $next_run = wp_next_scheduled('tornelo_auto_update');
        if ($next_run) {
            echo '<p><strong>Next auto-update:</strong> ' . date('Y-m-d H:i:s', $next_run) . '</p>';
        }
        ?>
    </div>
    <?php
}
