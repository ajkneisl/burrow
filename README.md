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

# username to your PgSQL database
export PG_USERNAME="postgre" 
# password to your PgSQL database
export PG_PASSWORD="postgre" 
# link to your PgSQL database
export PG_URL="jdbc:postgresql://localhost:5432/burrow" 

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

npm run dev # run a local server at http://localhost:5173   
# - OR - 
npm run build # create a build folder 
```