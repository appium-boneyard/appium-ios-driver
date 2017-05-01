#!/usr/bin/env bash

plist_path=$1/Contents/Developer/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator.sdk/Developer/Library/LaunchDaemons/com.apple.instruments.deviceservice.plist
iwd_path=$2/instruments-iwd/iwd7

if /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables dict" $plist_path ; then
    echo ":EnvironmentVariables created"
else
    echo ":EnvironmentVariables dictionary exists"
fi

if /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:DYLD_INSERT_LIBRARIES string $iwd_path/DTMobileISShim.dylib" $plist_path ; then
    echo "Added :EnvironmentVariables:DYLD_INSERT_LIBRARIES"
else
    echo ":EnvironmentVariables:DYLD_INSERT_LIBRARIES already exists. Resetting."
    /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:DYLD_INSERT_LIBRARIES $iwd_path/DTMobileISShim.dylib" $plist_path
fi

if /usr/libexec/PlistBuddy -c "Add :EnvironmentVariables:LIB_PATH string $iwd_path/" $plist_path ; then
    echo "Added :EnvironmentVariables:LIB_PATH"
else
    echo ":EnvironmentVariables:LIB_PATH already exists. Resetting."
    /usr/libexec/PlistBuddy -c "Set :EnvironmentVariables:LIB_PATH $iwd_path/" $plist_path
fi
