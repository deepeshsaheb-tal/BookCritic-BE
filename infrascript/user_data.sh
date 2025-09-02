#!/bin/bash
set -e

# Update system packages
yum update -y
yum install -y git

# Install Node.js
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2 globally
npm install -g pm2

# Install Nginx
amazon-linux-extras install -y nginx1
systemctl enable nginx
systemctl start nginx

# Clone the backend repository
cd /home/ec2-user
git clone ${github_repo} bookcritic-backend
cd bookcritic-backend

# Install dependencies
npm install

# Create .env file with database connection details
cat > .env << EOF
NODE_ENV=${node_env}
DB_HOST=${db_host}
DB_PORT=5432
DB_NAME=${db_name}
DB_USERNAME=${db_username}
DB_PASSWORD=${db_password}
PORT=3000
EOF

# Build the application
npm run build

# Start the application with PM2
pm2 start dist/main.js --name bookcritic
pm2 startup
pm2 save

# Configure Nginx as reverse proxy
cat > /etc/nginx/conf.d/bookcritic.conf << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Remove default Nginx configuration
rm -f /etc/nginx/conf.d/default.conf

# Restart Nginx to apply changes
systemctl restart nginx

# Set up basic monitoring script
cat > /home/ec2-user/monitor.sh << 'EOF'
#!/bin/bash

# Check if Node.js process is running
if ! pgrep -f "node" > /dev/null; then
    echo "Node.js process is not running. Restarting..."
    pm2 restart bookcritic
fi

# Check if Nginx is running
if ! systemctl is-active --quiet nginx; then
    echo "Nginx is not running. Restarting..."
    systemctl restart nginx
fi

# Log system metrics
echo "$(date) - Memory usage: $(free -m | awk 'NR==2{printf "%.2f%%", $3*100/$2}')" >> /home/ec2-user/system_metrics.log
echo "$(date) - Disk usage: $(df -h / | awk 'NR==2{print $5}')" >> /home/ec2-user/system_metrics.log
EOF

chmod +x /home/ec2-user/monitor.sh

# Add cron job to run monitoring script every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /home/ec2-user/monitor.sh") | crontab -

echo "Backend setup completed successfully!"
