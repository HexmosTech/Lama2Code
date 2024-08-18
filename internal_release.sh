#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# GitHub repository information
REPO_OWNER="HexmosTech"
REPO_NAME="Lama2Code"

# Function to download and install the VSIX
download_and_install_vsix() {
    # Fetch the latest pre-release information
    echo -e "${GREEN}Fetching latest pre-release information...${NC}"
    RELEASE_INFO=$(curl -s "https://api.github.com/repos/$REPO_OWNER/$REPO_NAME/releases" | jq '[.[] | select(.prerelease == true)] | first')

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

# Run the function
download_and_install_vsix