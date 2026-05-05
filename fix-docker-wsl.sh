#!/bin/bash
# Fix Docker credential store issue in WSL
mkdir -p ~/.docker
cat > ~/.docker/config.json << 'EOF'
{
  "credsStore": ""
}
EOF
echo "Docker config fixed. Retrying docker-compose..."
cd /mnt/c/Users/habti/OneDrive/Desktop/sfproject/BunaBingoBot
docker-compose up -d
