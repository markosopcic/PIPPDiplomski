FROM mcr.microsoft.com/dotnet/core/aspnet:3.0.0-bionic-arm32v7 AS base
WORKDIR /app
EXPOSE 80

FROM mcr.microsoft.com/dotnet/core/sdk:3.0-buster AS build
WORKDIR /src
COPY ["Projekt/Projekt.csproj", "Projekt/"]
RUN dotnet restore "Projekt/Projekt.csproj"
COPY . .
WORKDIR "/src/Projekt"
RUN dotnet build "Projekt.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Projekt.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Projekt.dll"]