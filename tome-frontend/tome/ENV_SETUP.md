# Environment Variables Setup

This project uses environment variables to configure API endpoints for different environments (development, staging, production).

## Quick Start

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the URLs in `.env`:**
   ```env
   EXPO_PUBLIC_CONTENT_API_URL=http://your-ip:8080/api
   EXPO_PUBLIC_AUTH_API_URL=http://your-ip:8082/api/auth
   EXPO_PUBLIC_USER_DATA_API_URL=http://your-ip:8083/api
   ```

3. **Restart your development server:**
   ```bash
   pnpm start
   ```

## Environment Variables

All environment variables use the `EXPO_PUBLIC_` prefix, which is required by Expo to make them available at runtime.

### EXPO_PUBLIC_CONTENT_API_URL
- **Description:** URL for the Tome Content Service (Books, Authors, Genres)
- **Default:** `http://localhost:8080/api`
- **Example:** `http://10.67.19.222:8080/api`

### EXPO_PUBLIC_AUTH_API_URL
- **Description:** URL for the Tome Auth Service
- **Default:** `http://localhost:8082/api/auth`
- **Example:** `http://10.67.19.222:8082/api/auth`

### EXPO_PUBLIC_USER_DATA_API_URL
- **Description:** URL for the Tome User Data Service (Reading Sessions, User Books, Lists)
- **Default:** `http://localhost:8083/api`
- **Example:** `http://10.67.19.222:8083/api`

## Different Environments

### Local Development
Use `localhost` or your machine's local IP address:
```env
EXPO_PUBLIC_CONTENT_API_URL=http://localhost:8080/api
EXPO_PUBLIC_AUTH_API_URL=http://localhost:8082/api/auth
EXPO_PUBLIC_USER_DATA_API_URL=http://localhost:8083/api
```

### Testing on Physical Device
Use your computer's IP address on the local network:
```env
EXPO_PUBLIC_CONTENT_API_URL=http://192.168.1.100:8080/api
EXPO_PUBLIC_AUTH_API_URL=http://192.168.1.100:8082/api/auth
EXPO_PUBLIC_USER_DATA_API_URL=http://192.168.1.100:8083/api
```

### Production
Use your production API URLs:
```env
EXPO_PUBLIC_CONTENT_API_URL=https://api.tome.app/content
EXPO_PUBLIC_AUTH_API_URL=https://api.tome.app/auth
EXPO_PUBLIC_USER_DATA_API_URL=https://api.tome.app/user-data
```

## Important Notes

1. **`.env` is gitignored** - Your local `.env` file will not be committed to version control
2. **Restart required** - Changes to `.env` require restarting the Expo development server
3. **EXPO_PUBLIC_ prefix** - All environment variables must start with `EXPO_PUBLIC_` to be available at runtime
4. **Fallback defaults** - If variables are not set, the app will use localhost defaults

## Troubleshooting

### Variables not loading?
- Make sure you restarted the Expo dev server (`pnpm start`)
- Check that variable names start with `EXPO_PUBLIC_`
- Verify the `.env` file is in the root of the `tome-frontend/tome/` directory

### Cannot connect to API?
- If testing on a physical device, use your computer's local network IP instead of `localhost`
- Ensure your backend services are running and accessible
- Check firewall settings if testing on a physical device

## Validation

The app will log environment configuration warnings on startup if any variables are using default values. Check the console output when starting the app to verify your configuration.
