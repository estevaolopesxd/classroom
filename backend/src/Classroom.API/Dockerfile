FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /app

# Copy project files for layer caching
COPY src/Classroom.Domain/*.csproj src/Classroom.Domain/
COPY src/Classroom.Application/*.csproj src/Classroom.Application/
COPY src/Classroom.Infrastructure/*.csproj src/Classroom.Infrastructure/
COPY src/Classroom.API/*.csproj src/Classroom.API/

# Restore dependencies
RUN dotnet restore src/Classroom.API/Classroom.API.csproj

# Copy remaining source
COPY . .

# Publish release build
RUN dotnet publish src/Classroom.API/Classroom.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Install FFmpeg + curl (curl needed for healthcheck)
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg curl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "Classroom.API.dll"]
