![Burrow Logo](https://umn.app/image/burrow.png)
# Burrow ([umn.app](https://umn.app))

A study group finder intended for the University of Minnesota. The frontend is built using ReactJS alongside Tailwind. The backend is built with Kotlin using Ktor, with PostgreSQL for data storage.

## Running Burrow

### Building using Docker
Ensure that Docker is installed and running.

```zsh
docker build -t burrow:latest .
docker run -d -p 8080:8080 burrow:latest
# live @ http://localhost:8080
```

### Building Individually

#### Backend
Java is required for this.

```zsh
cd backend

# this will create a `.jar` file at ./build/libs
./gradlew buildFatJar

# postgres authorization
export PG_USERNAME="postgre" 
export PG_PASSWORD="postgre" 
export PG_URL="jdbc:postgresql://localhost:5432/burrow"

# minio authorization
export S3_ACCESS_KEY="burrow"
export S3_SECRET_KEY="burrow"
export S3_ENDPOINT="http://localhost:9000"

java -jar ./build/libs/backend-all.jar
# live @ http://localhost:8080
# place frontend folder next to jar to use same server
```

#### Frontend
NodeJS and NPM are required for this.

```zsh
cd frontend
npm install

# or "http://localhost:8080/api" if backend is locally ran
export VITE_BASE_URL="https://umn.app/api" 
# or "http://localhost:9000" if minio is locally ran
export VITE_CDN_URL="https://cdn.umn.app"
# (if this is cdn.umn.app, you cannot upload images, but will use existing images for UMN users)

npm run dev # run a local server at http://localhost:5173   
# - OR - 
npm run build # create a build folder 
```