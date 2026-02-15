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
# Default AI provider (gemini)
export DEFAULT_AI_PROVIDER="gemini"

# Gemini model selection
export GEMINI_MODEL="gemini-2.5-pro"  # Options: gemini-2.5-pro, gemini-3-flash-preview

# Gemini parameters
export GEMINI_TEMPERATURE="0.7"        # 0.0 to 1.0 (creativity control)
export GEMINI_MAX_TOKENS="2000"       # Maximum tokens to generate
export GEMINI_TIMEOUT="30000"         # Request timeout in milliseconds
export GEMINI_MAX_RETRIES="3"         # Maximum retry attempts

# General settings
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

**Basic usage (with defaults):**
```bash
#!/bin/bash
export GEMINI_API_KEY="your-api-key-here"
export DEFAULT_AI_PROVIDER="gemini"
npm run cli -- enhanceResume --input resume.json --job job.txt
```

**With custom options:**
```bash
#!/bin/bash
export GEMINI_API_KEY="your-api-key-here"
npm run cli -- enhanceResume \
  --input resume.json \
  --job job.txt \
  --ai-model gemini-3-flash-preview \
  --ai-temperature 0.8 \
  --output ./enhanced-resumes
```

---

## Method 2: Using .env File (Recommended)

### Step 1: Copy the example .env file

```bash
cp .env.example .env
```

### Step 2: Edit `.env` file and add your API key

```bash
# Edit .env file
GEMINI_API_KEY=your-api-key-here
```

### Step 3: (Optional) Configure other settings

You can customize other settings in `.env`:

```env
GEMINI_API_KEY=your-api-key-here
GEMINI_MODEL=gemini-2.5-pro
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2000
GEMINI_TIMEOUT=30000
GEMINI_MAX_RETRIES=3
ENHANCEMENT_MODE=sequential
```

**Note:** The `.env` file is automatically loaded by the application. It's already in `.gitignore` so your API key won't be committed.

⚠️ **Warning:** Never commit API keys to version control!

---

## Configuration Options

### `defaultProvider`
- **Type:** `"gemini"`
- **Default:** `"gemini"`
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

// Load configuration (loads from .env file automatically)
const config = await loadAIConfig();

// Or load from optional JSON config file (not recommended - use .env instead)
const config = await loadAIConfig({
  loadFromFile: true,
  configPath: './custom-config.json',
  loadFromEnv: true,  // Also load from .env (default: true)
  validate: true      // Validate configuration (default: true)
});

// Get specific provider config
const geminiConfig = getGeminiConfig(config);

// Get default provider
const defaultProvider = getDefaultProvider(config);
```

---

## Configuration Priority

Configuration is loaded from `.env` file automatically. Priority order:

1. **CLI options** (highest priority)
2. **Environment variables** (from `.env` file or system environment)
3. **Defaults** (if neither is set)

**Example:**
- `.env`: `GEMINI_MODEL=gemini-2.5-pro`
- CLI: `--ai-model gemini-3-flash-preview`
- **Result:** `gemini-3-flash-preview` (CLI option wins)

---

## Validation

The configuration is automatically validated when loaded. Common validation errors:

- ❌ `Gemini API key is required` - API key is missing
- ❌ `Invalid Gemini model` - Model name is incorrect
- ❌ `Gemini temperature must be a number between 0 and 1` - Temperature out of range
- ❌ `Gemini maxTokens must be a positive number` - Invalid maxTokens value

---

## Security Best Practices

1. ✅ **Use `.env` file for API keys** (already in `.gitignore`)
   ```env
   GEMINI_API_KEY=your-api-key-here
   ```

2. ✅ **The `.env` file is already in `.gitignore`** (so your API key won't be committed)

3. ✅ **Keep `.env.example` in version control** (without secrets) - this is already done

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
- Make sure `GEMINI_API_KEY` is set in your `.env` file
- Or set it as an environment variable: `export GEMINI_API_KEY="your-key"`

### "Environment variable GEMINI_API_KEY is not set"
- Make sure you have a `.env` file with `GEMINI_API_KEY=your-key-here`
- Or set it as an environment variable: `export GEMINI_API_KEY="your-key"`
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

# Basic usage (uses defaults from environment)
npm run cli -- enhanceResume --input resume.json --job job.txt

# With custom options
npm run cli -- enhanceResume \
  --input resume.json \
  --job job.txt \
  --ai-model gemini-3-flash-preview \
  --ai-temperature 0.8
```

### Option B: Config File

```bash
# 1. Copy example config
cp .env.example .env

# 2. Edit .env and add your API key

# 3. Set API key
export GEMINI_API_KEY="your-key-here"

# 4. Basic usage (uses defaults from config file)
npm run cli -- enhanceResume --input resume.json --job job.txt

# 4b. With custom options (overrides config)
npm run cli -- enhanceResume \
  --input resume.json \
  --job job.txt \
  --ai-model gemini-3-flash-preview \
  --output ./custom-output
```

### Option C: .env File (All Settings)

```bash
# 1. Copy example .env file
cp .env.example .env

# 2. Edit .env with all your settings
# GEMINI_API_KEY=your-key-here
# GEMINI_MODEL=gemini-2.5-pro
# GEMINI_TEMPERATURE=0.7
# GEMINI_MAX_TOKENS=2000
# GEMINI_TIMEOUT=30000
# GEMINI_MAX_RETRIES=3
# ENHANCEMENT_MODE=sequential

# 3. Basic usage (uses all defaults from .env)
npm run cli -- enhanceResume --input resume.json --job job.txt

# 3b. With custom options (overrides .env)
npm run cli -- enhanceResume \
  --input resume.json \
  --job job.txt \
  --ai-temperature 0.9 \
  --template modern
```

---

## CLI Command Examples

### Basic Usage (All Defaults)

Uses default AI provider (`gemini`), model (`gemini-2.5-pro`), and temperature (`0.7`):

```bash
npm run cli -- enhanceResume \
  --input resume.json \
  --job job-description.txt
```

### With Custom AI Settings

Override AI model and temperature:

```bash
npm run cli -- enhanceResume \
  --input resume.json \
  --job job-description.txt \
  --ai-model gemini-3-flash-preview \
  --ai-temperature 0.8
```

### With All Options

Specify all options explicitly:

```bash
npm run cli -- enhanceResume \
  --input resume.json \
  --job job-description.txt \
  --output ./output \
  --template classic \
  --format pdf \
  --ai-provider gemini \
  --ai-model gemini-2.5-pro \
  --ai-temperature 0.7 \
  --verbose
```

## Next Steps

Once configuration is set up, the AI enhancement service will automatically use it when:
- You call `loadAIConfig()` in your code
- The service initializes and looks for the default provider
- The Gemini provider is registered with the configuration

**Note:** The configuration system is fully integrated into the CLI. You can use environment variables, config files, or CLI options to configure AI settings.
