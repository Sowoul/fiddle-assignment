## Description
I have tried to set the project up to be production ready, so the entire thing runs using docker, it pulls up the images for python, redis, and node. The api is written in flask, the frontend is made using nextjs.

## Requirements:
1. docker
2. docker-compose

## Instructions:
1. Use the wsl, or be on a linux machine
2. git clone this repo
3. Install docker and docker-compose, with the package manager based on the linux distro
4. Start the docker service if not already by ```sudo systemctl start docker```
5. Run ``` sudo docker compose up --build```
6. Go to localhost:3000, and enjoy the app!
