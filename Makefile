current_dir = $(shell pwd)
xcode_path:="$(shell xcode-select -print-path | sed s/\\/Contents\\/Developer//g)"
JSHINT_BIN=./node_modules/.bin/jshint
JSCS_BIN=./node_modules/.bin/jscs

DEFAULT: jshint jscs

jshint:
	gulp jshint

jscs:
	@$(JSCS_BIN) build/lib build/test

iwd: clone_iwd build_iwd export_iwd

authorize:
	sudo DevToolsSecurity --enable
	sudo security authorizationdb write system.privilege.taskport is-developer
	sudo chown -R `whoami`: `xcode-select -print-path`/Platforms/iPhoneSimulator.platform/Developer/SDKs/iPhoneSimulator*.sdk/Applications

clone_iwd:
	mkdir -p tmp
	rm -rf tmp/iwd
	git clone https://github.com/facebook/instruments-without-delay.git tmp/iwd

build_iwd:
	cd tmp/iwd && ./build.sh
	sudo xcode-select -switch $(xcode_path)

export_iwd:
	rm -rf instruments/iwd
	mkdir -p instruments/iwd
	cp -R tmp/iwd/build/* instruments/iwd

test: test_unit test_functional

test_unit:
	gulp once

test_functional:
	gulp e2e-test

print_env:
	@echo OS X version: `sw_vers -productVersion`
	@echo Xcode version: `xcodebuild build -version`
	@echo Xcode path: `xcode-select -print-path`
	@echo Node.js version: `node -v`

travis:
	make jshint print_env
ifeq ($(CI_CONFIG),unit)
	gulp once
else ifeq ($(CI_CONFIG),functional)
	gulp e2e-test
endif

coverage:
ifeq ($(CI_CONFIG),unit)
	gulp coverage
else ifeq ($(CI_CONFIG),functional)
	gulp coverage-e2e
endif

prepublish: jshint jscs iwd test

clean_trace:
	rm -rf instrumentscli*.trace

.PHONY: \
	DEFAULT \
	jshint \
	jscs \
	iwd \
	clone_iwd \
	build_iwd \
	test \
	authorize \
	travis \
	prepublish \
	print_env \
	clean_trace
