run_dev:
	docker-compose -f compose.dev.yaml up

run_emulators:
	firebase emulators:start