# iPhone Shortcuts — Upload to VideoBin

Upload videos directly from your iPhone to VideoBin using the native Shortcuts app.

---

## Single Video Upload

Open the **Shortcuts** app → tap **+** to create a new shortcut.

### Action 1: Select Photos

- Tap **Add Action** → search **"Select Photos"**
- Tap the word **Photos** in the action → toggle off everything except **Videos**

### Action 2: Get Contents of URL

- Tap **+** → search **"Get Contents of URL"**
- Tap the URL field → type your server URL:
  ```
  https://video-bin.samui-bikes.com/api/upload/direct
  ```

#### Configure the request

Tap **Show More** to expand options:

1. **Method** → **POST**

2. **Headers** → tap **Add Header**
   - Key: type in `x-title`
   - Value: tap the value field → Tap the **Photos** pill → select **Media** → choose **Date Created**
   - (This sets the video title to the upload date, e.g. "3 Apr 14:03")

3. **Request Body** → **File**
   - Tap the value field → a blue **Photos** pill appears
   - Tap the **Photos** pill → select **Media**
   - Tap **Media** again to confirm

### Save

Tap the name at the top → rename to **"Upload to VideoBin"** → tap **Done**.

---

## Multiple Video Upload

To upload several videos at once, modify the shortcut:

### Action 1: Select Photos

- Same as above, but tap **Show More** → turn on **Select Multiple**

### Action 2: Repeat with Each

- Tap **+** → search **"Repeat with Each"**
- Set it to repeat with: **Selected Photos**

### Action 3: Get Contents of URL (inside the loop)

- Tap **+** (inside the Repeat block) → search **"Get Contents of URL"**
- URL: `https://video-bin.samui-bikes.com/api/upload/direct`

#### Configure the request

1. **Method** → **POST**

2. **Headers** → tap **Add Header**
   - Key: type in `x-title`
   - Value: tap the value field → tap **Repeat Item** pill → select **Media** → select **Date Created**
   - (This uses each video's original filename as the title)

3. **Request Body** → **File**
   - Tap the value field → tap **Repeat Item** pill → select **Media**
   - Tap **Media** again to confirm

### End Repeat

The "End Repeat" block is added automatically.

**Key difference from single upload:** Inside the loop, both `x-title` and the file value must use **Repeat Item** (not Photos). Tap **Repeat Item** → **Media** for both.

---

## How to use

| Method | Steps |
|--------|-------|
| **Shortcuts app** | Open Shortcuts → tap the shortcut |
| **Share Sheet** | In Photos, tap Share → scroll down → tap "Upload to VideoBin" |
| **Home Screen** | Long-press the shortcut → Add to Home Screen → one-tap icon |

---

## Important notes

- Header keys must **not** contain spaces (the server rejects them)
- `x-title` sets the video title in the dashboard — without it, the iPhone filename is used as fallback (e.g. `img_8749`)
- The file variable must follow the chain: **Repeat Item → Media → Media** (multi) or **Photos → Media → Media** (single)
- Maximum file size: 2 GB per video
