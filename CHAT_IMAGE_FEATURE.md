# Chat Image Feature Implementation

## Overview
Added image sending functionality to the chat support system, allowing both sellers and admins to send images in their messages.

## Features Implemented

### 1. Image Upload & Display
- **Image Upload**: Users can attach images using the upload button
- **Image Preview**: Shows preview of selected image before sending
- **Image Display**: Images are displayed inline in chat messages
- **Click to Enlarge**: Click on images to view them in full size

### 2. Image Processing
- **Validation**: File size and type validation (max 5MB, JPEG/PNG/WebP)
- **Compression**: Automatic image compression to reduce file size
- **Base64 Storage**: Images stored as base64 in database
- **Responsive Display**: Images scale properly on different screen sizes

### 3. User Experience
- **Upload Button**: Dedicated image upload button with icon
- **Preview with Remove**: Shows selected image with remove option
- **Loading States**: Disabled inputs during upload
- **Error Handling**: Clear error messages for invalid files

## Technical Implementation

### Database Schema Update
**File**: `models/SupportMessage.ts`
```typescript
export interface ISupportMessage extends Document {
  senderId: string;
  senderRole: "seller" | "admin";
  receiverId: string;
  message: string;
  image?: string; // Base64 encoded image
  createdAt: Date;
  seenByAdmin?: boolean;
  seenBySeller?: boolean;
}
```

### Component Updates
**File**: `components/ChatSupport.tsx`

#### New State Variables
```typescript
const [selectedImage, setSelectedImage] = useState<File | null>(null);
const [imagePreview, setImagePreview] = useState<string | null>(null);
const [isUploading, setIsUploading] = useState(false);
const fileInputRef = useRef<HTMLInputElement>(null);
```

#### Image Handling Functions
```typescript
const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
    const validation = validateImageFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }
    setSelectedImage(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
  }
};

const removeSelectedImage = () => {
  setSelectedImage(null);
  if (imagePreview) {
    URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
  }
};
```

#### Updated Message Interface
```typescript
interface Message {
  senderId: string;
  senderRole: string;
  receiverId: string;
  message: string;
  image?: string; // Base64 encoded image
  createdAt: string;
}
```

### Socket Handler Update
**File**: `pages/api/support-socket.ts`
```typescript
const savedMessage = await SupportMessage.create({
  senderId: msg.senderId,
  senderRole: msg.senderRole,
  receiverId: msg.receiverId,
  message: msg.message,
  image: msg.image, // Include image if present
  createdAt: msg.createdAt || new Date(),
  seenByAdmin: msg.senderRole === "admin" ? true : false,
  seenBySeller: msg.senderRole === "seller" ? true : false,
});
```

## User Interface

### Message Display
- **Text Messages**: Display normally with text content
- **Image Messages**: Show image above text (if both present)
- **Image Only**: Display image without text container
- **Click to Enlarge**: Images open in new tab when clicked

### Input Area
- **Text Input**: Standard text input for messages
- **Upload Button**: Paperclip icon button for image selection
- **Preview Area**: Shows selected image with remove button
- **Send Button**: Disabled when no content and not uploading

### Visual States
- **Default**: Text input + upload button + send button
- **Image Selected**: Preview appears above input area
- **Uploading**: All inputs disabled, send button shows "Sending..."
- **Error**: Alert shows validation error message

## Image Processing Flow

1. **File Selection**: User clicks upload button and selects image
2. **Validation**: Check file size (< 5MB) and type (JPEG/PNG/WebP)
3. **Preview**: Show preview with remove option
4. **Compression**: Convert to base64 and compress to 800px max width
5. **Sending**: Include image in message payload
6. **Storage**: Save base64 image to database
7. **Display**: Show image in chat for all participants

## Benefits

1. **Enhanced Communication**: Visual context for support issues
2. **Better UX**: Intuitive image upload and preview
3. **Performance**: Image compression reduces file sizes
4. **Compatibility**: Works with existing chat infrastructure
5. **Responsive**: Images scale properly on all devices

## Testing

To test the image feature:

1. **Navigate to chat**: Go to seller or admin chat page
2. **Upload image**: Click upload button and select an image
3. **Verify preview**: Check that image preview appears
4. **Send message**: Send with or without text
5. **Check display**: Verify image appears in chat
6. **Test click**: Click image to open in new tab
7. **Test validation**: Try uploading invalid files

## File Size Limits

- **Maximum Size**: 5MB per image
- **Supported Formats**: JPEG, PNG, WebP
- **Compression**: Automatic compression to 800px max width
- **Quality**: 80% JPEG quality for optimal size/quality balance

## Security Considerations

- **File Validation**: Server-side validation of file types
- **Size Limits**: Prevents large file uploads
- **Base64 Storage**: Secure storage in database
- **No External Dependencies**: Uses built-in browser APIs

## Future Enhancements

1. **Multiple Images**: Support for multiple images per message
2. **Image Gallery**: Better image viewing experience
3. **Thumbnail Generation**: Smaller thumbnails for better performance
4. **Cloud Storage**: Move to cloud storage for better scalability
5. **Image Editing**: Basic image editing capabilities 