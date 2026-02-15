# AI Configuration Guide

This guide explains how to configure the AI provider settings for the resume builder.

## Configuration Methods

The AI configuration system supports two methods (you can use either or both):

1. **Environment Variables** - Quick setup, good for CI/CD and production
2. **Config File** - Better for local development, version control friendly (without secrets)

**Priority:** Config file settings take precedence over environment variables.

---

## Method 1: Environment Variables

Set the following environment variables:

### Required for Gemini
```bash
export GEMINI_API_KEY="your-api-key-here"
```

### Optional Settings
```bash
# Default AI provider (gemini or mock)
export DEFAULT_AI_PROVIDER="gemini"

# Gemini model selection
export GEMINI_MODEL="gemini-2.5-pro"  # Options: gemini-2.5-pro, gemini-3-flash-preview

# Gemini parameters
export GEMINI_TEMPERATURE="0.7"        # 0.0 to 1.0 (creativity control)
export GEMINI_MAX_TOKENS="2000"       # Maximum tokens to generate
export GEMINI_TIMEOUT="30000"         # Request timeout in milliseconds
export GEMINI_MAX_RETRIES="3"         # Maximum retry attempts

# General settings
export FALLBACK_TO_MOCK="true"        # Fallback to mock service on errors
export ENHANCEMENT_MODE="sequential"   # sequential or agent
```

### Example: Setting up in your shell
```bash
# In ~/.bashrc or ~/.zshrc
export GEMINI_API_KEY="your-api-key-here"
export DEFAULT_AI_PROVIDER="gemini"
export GEMINI_MODEL="gemini-2.5-pro"
```

### Example: Using in a script
```bash
#!/bin/bash
export GEMINI_API_KEY="your-api-key-here"
export DEFAULT_AI_PROVIDER="gemini"
npm run cli -- enhanceResume --input resume.json --job job.txt
```

---

## Method 2: Config File

### Step 1: Copy the example config file

```bash
cp src/config/ai.config.example.json ai.config.json
```

### Step 2: Edit `ai.config.json` in the project root

```json
{
  "defaultProvider": "gemini",
  "providers": {
    "gemini": {
      "apiKey": "${GEMINI_API_KEY}",
      "model": "gemini-2.5-pro",
      "temperature": 0.7,
      "maxTokens": 2000,
      "timeout": 30000,
      "maxRetries": 3,
      "retryDelayBase": 1000
    }
  },
  "fallbackToMock": true,
  "enhancementMode": "sequential"
}
```

### Step 3: Set the API key environment variable

The config file uses `${GEMINI_API_KEY}` syntax to reference environment variables:

```bash
export GEMINI_API_KEY="your-api-key-here"
```

**Note:** You can also put the API key directly in the config file, but this is **not recommended** for security reasons. Always use environment variable references for secrets.

### Alternative: Direct API key in config (not recommended)

```json
{
  "providers": {
    "gemini": {
      "apiKey": "your-api-key-directly-here",
      "model": "gemini-2.5-pro"
    }
  }
}
```

⚠️ **Warning:** Never commit API keys to version control!

---

## Configuration Options

### `defaultProvider`
- **Type:** `"gemini" | "mock"`
- **Default:** `"mock"`
- **Description:** Which AI provider to use by default

### `providers.gemini.apiKey`
- **Type:** `string`
- **Required:** Yes (if using Gemini)
- **Description:** Your Google Gemini API key
- **Security:** Use environment variable reference: `"${GEMINI_API_KEY}"`

### `providers.gemini.model`
- **Type:** `"gemini-2.5-pro" | "gemini-2.5-pro" | "gemini-3-flash-preview"`
- **Default:** `"gemini-2.5-pro"`
- **Description:** Which Gemini model to use
  - `gemini-2.5-pro`: Original model
  - `gemini-2.5-pro`: Latest Pro model (recommended)
  - `gemini-3-flash-preview`: Faster, cheaper model

### `providers.gemini.temperature`
- **Type:** `number` (0.0 to 1.0)
- **Default:** `0.7`
- **Description:** Controls creativity/randomness
  - Lower (0.0-0.3): More deterministic, focused
  - Higher (0.7-1.0): More creative, varied

### `providers.gemini.maxTokens`
- **Type:** `number` (positive integer)
- **Default:** `2000`
- **Description:** Maximum tokens in AI response

### `providers.gemini.timeout`
- **Type:** `number` (milliseconds)
- **Default:** `30000` (30 seconds)
- **Description:** Request timeout

### `providers.gemini.maxRetries`
- **Type:** `number` (non-negative integer)
- **Default:** `3`
- **Description:** Maximum retry attempts on failure

### `providers.gemini.retryDelayBase`
- **Type:** `number` (milliseconds)
- **Default:** `1000` (1 second)
- **Description:** Base delay for exponential backoff retries

### `fallbackToMock`
- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether to fallback to mock service if AI provider fails

### `enhancementMode`
- **Type:** `"sequential" | "agent"`
- **Default:** `"sequential"`
- **Description:** Enhancement workflow mode
  - `sequential`: Two-step process (Review → Modify)
  - `agent`: Future agent-based approach (not yet implemented)

---

## Usage in Code

The configuration is loaded using the `loadAIConfig()` function:

```typescript
import { loadAIConfig, getGeminiConfig, getDefaultProvider } from '@services/ai/config';

// Load configuration (defaults to ./ai.config.json)
const config = await loadAIConfig();

// Or specify a custom path
const config = await loadAIConfig({
  configPath: './custom-config.json',
  loadFromEnv: true,  // Also load from environment (default: true)
  loadFromFile: true, // Also load from file (default: true)
  validate: true      // Validate configuration (default: true)
});

// Get specific provider config
const geminiConfig = getGeminiConfig(config);

// Get default provider
const defaultProvider = getDefaultProvider(config);
```

---

## Configuration Priority

When both environment variables and config file are present:

1. **Config file** settings take precedence
2. **Environment variables** are used as fallback
3. **Defaults** are used if neither is set

**Example:**
- Environment: `GEMINI_MODEL=gemini-2.5-pro`
- Config file: `"model": "gemini-2.5-pro"`
- **Result:** `gemini-2.5-pro` (config file wins)

---

## Validation

The configuration is automatically validated when loaded. Common validation errors:

- ❌ `Gemini API key is required` - API key is missing
- ❌ `Invalid Gemini model` - Model name is incorrect
- ❌ `Gemini temperature must be a number between 0 and 1` - Temperature out of range
- ❌ `Gemini maxTokens must be a positive number` - Invalid maxTokens value

---

## Security Best Practices

1. ✅ **Use environment variables for API keys**
   ```json
   "apiKey": "${GEMINI_API_KEY}"
   ```

2. ✅ **Add `ai.config.json` to `.gitignore`** (if it contains secrets)
   ```gitignore
   ai.config.json
   ```

3. ✅ **Keep `ai.config.example.json` in version control** (without secrets)

4. ✅ **Never commit API keys to version control**

---

## Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Set it as an environment variable:
   ```bash
   export GEMINI_API_KEY="your-api-key-here"
   ```

---

## Troubleshooting

### "Configuration validation failed: Gemini API key is required"
- Make sure `GEMINI_API_KEY` environment variable is set
- Or provide `apiKey` in the config file

### "Environment variable GEMINI_API_KEY is not set"
- The config file references `${GEMINI_API_KEY}` but the env var is not set
- Set the environment variable or use a direct API key in the config

### "Config file not found"
- This is normal if you're only using environment variables
- The system will fall back to environment variables and defaults

### Configuration not being used
- Check that the config file is in the project root (where you run commands)
- Verify environment variables are set in the same shell session
- Check that config file JSON is valid

---

## Example: Complete Setup

### Option A: Environment Variables Only

```bash
# Set environment variables
export GEMINI_API_KEY="your-key-here"
export DEFAULT_AI_PROVIDER="gemini"
export GEMINI_MODEL="gemini-2.5-pro"

# Use the application
npm run cli -- enhanceResume --input resume.json --job job.txt
```

### Option B: Config File

```bash
# 1. Copy example config
cp src/config/ai.config.example.json ai.config.json

# 2. Edit ai.config.json (already has good defaults)

# 3. Set API key
export GEMINI_API_KEY="your-key-here"

# 4. Use the application
npm run cli -- enhanceResume --input resume.json --job job.txt
```

### Option C: Both (Config File + Environment Variables)

```bash
# 1. Set API key in environment
export GEMINI_API_KEY="your-key-here"

# 2. Create config file with other settings
cat > ai.config.json << EOF
{
  "defaultProvider": "gemini",
  "providers": {
    "gemini": {
      "apiKey": "\${GEMINI_API_KEY}",
      "model": "gemini-2.5-pro",
      "temperature": 0.7
    }
  }
}
EOF

# 3. Use the application
npm run cli -- enhanceResume --input resume.json --job job.txt
```

---

## Next Steps

Once configuration is set up, the AI enhancement service will automatically use it when:
- You call `loadAIConfig()` in your code
- The service initializes and looks for the default provider
- The Gemini provider is registered with the configuration

**Note:** The configuration system is implemented but not yet fully integrated into the CLI/API. Integration will happen in future tasks.
