# Gemini AI Setup Guide

This guide provides detailed instructions for setting up and using Google Gemini AI models with the resume builder.

## Overview

The resume builder uses Google Gemini AI models to enhance resumes based on job descriptions. The system supports two models:

- **`gemini-2.5-pro`** (default) - Best quality, recommended for production use
- **`gemini-3-flash-preview`** - Faster and more cost-effective, good for testing and high-volume use

## Prerequisites

1. **Google AI API Key**
   - Sign up at [Google AI Studio](https://aistudio.google.com/)
   - Create an API key from the API Keys section
   - Copy your API key for use in configuration

2. **Node.js Environment**
   - Node.js 18.0.0 or higher
   - npm or yarn package manager

## Quick Setup

### Step 1: Create `.env` File

```bash
# Copy the example .env file
cp .env.example .env
```

### Step 2: Add Your API Key

Edit `.env` and add your Gemini API key:

```env
GEMINI_API_KEY=your-api-key-here
```

### Step 3: (Optional) Configure Model and Settings

```env
# Use gemini-2.5-pro (default) for best quality
GEMINI_MODEL=gemini-2.5-pro

# Or use gemini-3-flash-preview for faster/cheaper
# GEMINI_MODEL=gemini-3-flash-preview

# Adjust temperature (0.0-1.0, default: 0.7)
GEMINI_TEMPERATURE=0.7

# Maximum tokens (default: 2000)
GEMINI_MAX_TOKENS=2000

# Request timeout in milliseconds (default: 30000)
GEMINI_TIMEOUT=30000

# Maximum retry attempts (default: 3)
GEMINI_MAX_RETRIES=3
```

### Step 4: Test Your Setup

```bash
npm run dev -- enhanceResume \
  --input examples/resume.json \
  --job examples/job-description.txt
```

## Model Selection

### gemini-2.5-pro (Recommended)

**Best for:** Production use, high-quality enhancements

**Characteristics:**
- Highest quality output
- Better understanding of context
- More accurate keyword integration
- Slower response time
- Higher cost per request

**When to use:**
- Final resume preparation
- Important job applications
- When quality is paramount

### gemini-3-flash-preview

**Best for:** Testing, high-volume processing, cost-sensitive use

**Characteristics:**
- Fast response times
- Lower cost per request
- Good quality output
- Higher rate limits
- Suitable for batch processing

**When to use:**
- Testing and development
- Processing multiple resumes
- When speed is important
- Cost-sensitive scenarios

## Configuration Options

### Temperature

Controls the creativity/randomness of AI responses:

- **0.0-0.3**: Very conservative, minimal changes
- **0.4-0.6**: Balanced, natural enhancements
- **0.7** (default): Good balance of creativity and accuracy
- **0.8-1.0**: More creative, may introduce more variations

**Recommendation:** Start with 0.7, adjust based on results.

### Max Tokens

Maximum number of tokens the AI can generate in a response:

- **1000-1500**: Shorter responses, faster
- **2000** (default): Balanced length
- **3000-4000**: Longer, more detailed responses

**Note:** Larger values increase response time and cost.

### Timeout

Maximum time to wait for API response (in milliseconds):

- **15000** (15s): Fast timeout, may fail on slow connections
- **30000** (30s, default): Good balance
- **60000** (60s): For large resumes or slow networks

### Max Retries

Number of automatic retries on failure:

- **0**: No retries (fails immediately on error)
- **3** (default): Good balance
- **5**: More resilient, but slower on failures

## Best Practices

### 1. Start with Defaults

Begin with default settings and adjust based on your needs:

```bash
npm run dev -- enhanceResume \
  --input resume.json \
  --job job-description.txt
```

### 2. Use Appropriate Model

- Use `gemini-2.5-pro` for final resumes
- Use `gemini-3-flash-preview` for testing and iterations

### 3. Monitor API Usage

- Check your usage in [Google AI Studio](https://aistudio.google.com/)
- Set up billing alerts if needed
- Monitor rate limits

### 4. Handle Rate Limits

If you encounter rate limit errors:

- Wait a few minutes before retrying
- Use `gemini-3-flash-preview` which has higher rate limits
- Implement exponential backoff in your scripts
- Consider processing resumes in batches

### 5. Optimize Prompt Length

For very long resumes:

- Increase `GEMINI_MAX_TOKENS` if you get timeout errors
- The system automatically handles prompt length, but very large resumes may need adjustment

## Troubleshooting

### API Key Issues

**Error: "Gemini API key not configured"**
- Verify `.env` file exists in project root
- Check that `GEMINI_API_KEY` is set correctly
- Ensure no extra spaces or quotes around the key
- Restart your terminal/IDE after setting environment variables

### Rate Limit Errors

**Error: "Rate limit exceeded"**
- Wait 1-2 minutes before retrying
- Switch to `gemini-3-flash-preview` for higher limits
- Check your quota in Google AI Studio
- Consider upgrading your API tier

### Timeout Errors

**Error: "Request timeout"**
- Increase `GEMINI_TIMEOUT` in `.env` (e.g., 60000 for 60 seconds)
- Use `gemini-3-flash-preview` for faster responses
- Check your network connection
- Reduce `GEMINI_MAX_TOKENS` if using very high values

### Invalid Response Errors

**Error: "Invalid response from Gemini"**
- This is usually temporary - retry the request
- Check that your API key has proper permissions
- Verify you're using a supported model name
- Run with `--verbose` flag for detailed error information

## Pricing Information

**Note:** Cost calculation is currently disabled and will be improved in later phases. The system tracks token usage but does not calculate costs.

For current pricing information, visit:
- [Google AI Pricing](https://ai.google.dev/pricing)
- [Google AI Studio](https://aistudio.google.com/) for your account usage

## Advanced Configuration

### Using Different Models Per Request

You can override the default model for specific requests:

**CLI:**
```bash
npm run dev -- enhanceResume \
  --input resume.json \
  --job job-description.txt \
  --ai-model gemini-3-flash-preview
```

**API:**
```json
{
  "resume": { ... },
  "jobDescription": "...",
  "aiModel": "gemini-3-flash-preview"
}
```

### Environment-Specific Configuration

**Development:**
```env
GEMINI_MODEL=gemini-3-flash-preview
GEMINI_TEMPERATURE=0.8
GEMINI_MAX_TOKENS=1500
```

**Production:**
```env
GEMINI_MODEL=gemini-2.5-pro
GEMINI_TEMPERATURE=0.7
GEMINI_MAX_TOKENS=2000
GEMINI_TIMEOUT=60000
```

## Security Best Practices

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use environment variables in CI/CD** - Don't hardcode API keys
3. **Rotate API keys regularly** - Especially if exposed
4. **Use separate keys for dev/prod** - Easier to manage and revoke
5. **Monitor API usage** - Set up alerts for unusual activity

## Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [AI Configuration Guide](./AI_CONFIG.md) - Detailed configuration options
- [API Documentation](./API.md) - API endpoint documentation

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review [AI_CONFIG.md](./AI_CONFIG.md) for configuration details
3. Check the project's GitHub issues
4. Verify your API key is valid in Google AI Studio
