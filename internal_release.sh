#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# GitHub repository information
REPO_OWNER="HexmosTech"
REPO_NAME_CORE="Lama2"
REPO_NAME_EXTENSION="Lama2Code"
# Function to download and install the Lama2 binary
download_and_install_l2() {
    # Fetch the latest pre-release information
    echo -e "${GREEN}Fetching latest pre-release information...${NC}"
    RELEASE_INFO=$(curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME_CORE/releases" | jq '[.[] | select(.prerelease == true)] | first')

    if [ -z "$RELEASE_INFO" ] || [ "$RELEASE_INFO" = "null" ]; then
        echo -e "${RED}No pre-release found${NC}"
        exit 1
    fi

    # Extract the binary download URL
    BINARY_URL=$(echo "$RELEASE_INFO" | jq -r '.assets[] | select(.name | endswith("l2")) | .browser_download_url')
    TAG_NAME=$(echo "$RELEASE_INFO" | jq -r '.tag_name')

    if [ -z "$BINARY_URL" ] || [ "$BINARY_URL" = "null" ]; then
        echo -e "${RED}No binary file found in the latest pre-release${NC}"
        exit 1
    fi

    echo -e "${GREEN}Downloading l2 binary from $BINARY_URL${NC}"
    curl -L -o /tmp/l2 "$BINARY_URL"
    
    sudo mv /tmp/l2 /usr/local/bin/l2
    sudo chmod +x /usr/local/bin/l2
}

# Function to download and install the VSIX
download_and_install_vsix() {
    # Fetch the latest pre-release information
    echo -e "${GREEN}Fetching latest pre-release information...${NC}"
    RELEASE_INFO=$(curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME_EXTENSION/releases" | jq '[.[] | select(.prerelease == true)] | first')

    if [ -z "$RELEASE_INFO" ] || [ "$RELEASE_INFO" = "null" ]; then
        echo -e "${RED}No pre-release found${NC}"
        exit 1
    fi

    # Extract the VSIX download URL and tag name
    VSIX_URL=$(echo "$RELEASE_INFO" | jq -r '.assets[] | select(.name | endswith(".vsix")) | .browser_download_url')
    TAG_NAME=$(echo "$RELEASE_INFO" | jq -r '.tag_name')

    if [ -z "$VSIX_URL" ] || [ "$VSIX_URL" = "null" ]; then
        echo -e "${RED}No VSIX file found in the latest pre-release${NC}"
        exit 1
    fi

    echo -e "${GREEN}Downloading VSIX file from $VSIX_URL${NC}"
    wget -O "/tmp/$TAG_NAME.vsix" "$VSIX_URL"

    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to download VSIX file${NC}"
        exit 1
    fi

    echo -e "${GREEN}Installing VSIX in VS Code${NC}"
    code --install-extension "/tmp/$TAG_NAME.vsix"

    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install VSIX in VS Code${NC}"
        exit 1
    fi

    rm "/tmp/$TAG_NAME.vsix"
    echo -e "${GREEN}Successfully installed $TAG_NAME${NC}"
}

# Check if required tools are installed
command -v jq >/dev/null 2>&1 || { echo -e >&2 "${RED}This script requires jq but it's not installed. Please install it and try again.${NC}"; exit 1; }
command -v curl >/dev/null 2>&1 || { echo -e >&2 "${RED}This script requires curl but it's not installed. Please install it and try again.${NC}"; exit 1; }
command -v wget >/dev/null 2>&1 || { echo -e >&2 "${RED}This script requires wget but it's not installed. Please install it and try again.${NC}"; exit 1; }
command -v code >/dev/null 2>&1 || { echo -e >&2 "${RED}This script requires VS Code to be installed and accessible via 'code' command.${NC}"; exit 1; }

# Main execution
download_and_install_l2

if l2 --version > /dev/null 2>&1; then 
    echo -e "${GREEN}Successfully installed Lama2 beta version; Type 'l2 <api_file>' to invoke Lama2${NC}"
    echo -e "${YELLOW}Installed version:${NC}"
    l2 --version

    # Download and install VSIX after successful l2 installation
    download_and_install_vsix
else 
    echo -e "${RED}Failure in installation; please report issue at github.com/HexmosTech/Lama2${NC}"
fi
