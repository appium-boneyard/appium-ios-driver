#!/usr/bin/env bash
sudo security authorizationdb write com.apple.dt.instruments.process.analysis <  ./bin/com.apple.dt.instruments.process.analysis.plist
sudo security authorizationdb write com.apple.dt.instruments.process.kill <  ./bin/com.apple.dt.instruments.process.kill.plist
