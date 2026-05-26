# Multi-stage production build for Immersio Web API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copy csproj files and restore dependencies
COPY ["Immersio.WebApi/Immersio.WebApi.csproj", "Immersio.WebApi/"]
COPY ["Immersio.Application/Immersio.Application.csproj", "Immersio.Application/"]
COPY ["Immersio.Domain/Immersio.Domain.csproj", "Immersio.Domain/"]
COPY ["Immersio.Infrastructure/Immersio.Infrastructure.csproj", "Immersio.Infrastructure/"]
RUN dotnet restore "Immersio.WebApi/Immersio.WebApi.csproj"

# Copy remaining code and publish
COPY . .
RUN dotnet publish "Immersio.WebApi/Immersio.WebApi.csproj" -c Release -o /publish

# Final runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
COPY --from=build /publish .

# Environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5249
EXPOSE 5249

ENTRYPOINT ["dotnet", "Immersio.WebApi.dll"]
