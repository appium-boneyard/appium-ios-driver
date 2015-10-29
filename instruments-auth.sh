#!/usr/bin/env bash
sudo security authorizationdb write com.apple.dt.instruments.process.analysis <  com.apple.dt.instruments.process.analysis.plist
sudo security authorizationdb write com.apple.dt.instruments.process.kill <  com.apple.dt.instruments.process.kill.plist
