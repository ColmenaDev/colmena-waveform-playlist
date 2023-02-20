## Makefile for colmena-waveform playlist


all: install

bundle:
	npm install
	npx webpack

install:
	install -d /var/www/html/waveform-playlist
	cp -r dist/waveform-playlist/* /var/www/html/waveform-playlist
