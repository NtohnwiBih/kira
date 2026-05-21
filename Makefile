.PHONY: dev build test migrate seed logs reset-db

dev:
	docker compose up --remove-orphans

build:
	docker compose -f docker-compose.prod.yml build

test:
	docker compose exec backend npm run test
	docker compose exec frontend npm run test

migrate:
	docker compose exec backend npx prisma migrate dev

seed:
	docker compose exec backend npx prisma db seed

logs:
	docker compose logs -f

reset-db:
	docker compose exec backend npx prisma migrate reset --force