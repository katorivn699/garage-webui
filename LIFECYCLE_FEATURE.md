# Object Lifecycle Management Feature

## Overview
Tính năng quản lý lifecycle cho phép tự động xóa objects trong S3 buckets sau một khoảng thời gian nhất định. Điều này hữu ích cho việc quản lý temporary files, logs, hoặc data có thời hạn sử dụng.

## Tính năng chính

### 1. **Lifecycle Rules Configuration**
- Tạo, chỉnh sửa, và xóa lifecycle rules cho mỗi bucket
- Hỗ trợ nhiều rules với các điều kiện khác nhau
- Enable/Disable rules mà không cần xóa

### 2. **Expiration Settings**
- **Object Expiration**: Tự động xóa objects sau X ngày
- **Prefix Filter**: Áp dụng rule cho objects có prefix cụ thể (ví dụ: `temp/`, `logs/`)
- **Multipart Upload Cleanup**: Tự động xóa incomplete multipart uploads

### 3. **UI Integration**
- Lifecycle section trong bucket Overview tab
- Dialog form để thêm/sửa rules
- Hiển thị trạng thái và cấu hình của từng rule

## Cách sử dụng

### Tạo Lifecycle Rule mới

1. Vào **Buckets** → Chọn bucket → Tab **Overview**
2. Scroll xuống section **Lifecycle Rules**
3. Click **Add Rule**
4. Điền thông tin:
   - **Rule ID**: Tên định danh cho rule (ví dụ: `temp-files-cleanup`)
   - **Status**: Enabled hoặc Disabled
   - **Prefix**: (Optional) Chỉ áp dụng cho objects có prefix này
   - **Delete objects after (days)**: Số ngày trước khi xóa
   - **Abort incomplete uploads**: (Optional) Tự động xóa incomplete multipart uploads

5. Click **Save Rule**

### Ví dụ Use Cases

#### 1. Temporary Files Storage
```
Rule ID: temp-files-expiration
Status: Enabled
Prefix: temp/
Delete after: 7 days
```
→ Tất cả files trong folder `temp/` sẽ tự động xóa sau 7 ngày

#### 2. Log Rotation
```
Rule ID: logs-cleanup
Status: Enabled
Prefix: logs/
Delete after: 30 days
```
→ Logs cũ hơn 30 ngày sẽ tự động bị xóa

#### 3. User Uploads Cleanup
```
Rule ID: user-uploads
Status: Enabled
Prefix: uploads/
Delete after: 90 days
Abort incomplete uploads: 7 days
```
→ User uploads sẽ bị xóa sau 90 ngày, incomplete uploads sau 7 ngày

## API Endpoints

### GET `/api/buckets/lifecycle?bucket={bucket_name}`
Lấy lifecycle configuration của bucket

**Response:**
```json
{
  "rules": [
    {
      "id": "temp-files",
      "status": "Enabled",
      "prefix": "temp/",
      "expiration": {
        "days": 7
      }
    }
  ]
}
```

### PUT `/api/buckets/lifecycle?bucket={bucket_name}`
Cập nhật lifecycle configuration

**Request Body:**
```json
{
  "rules": [
    {
      "id": "temp-files",
      "status": "Enabled",
      "prefix": "temp/",
      "expiration": {
        "days": 7
      },
      "abortIncompleteMultipartUpload": {
        "daysAfterInitiation": 7
      }
    }
  ]
}
```

### DELETE `/api/buckets/lifecycle?bucket={bucket_name}`
Xóa toàn bộ lifecycle configuration

## Technical Details

### Backend Implementation
- **File**: `backend/router/buckets.go`
- **Schema**: `backend/schema/bucket.go`
- Sử dụng AWS S3 SDK v2 (`PutBucketLifecycleConfiguration`, `GetBucketLifecycleConfiguration`)
- Garage Storage hỗ trợ đầy đủ S3 Lifecycle API

### Frontend Implementation
- **UI Component**: `src/pages/buckets/manage/overview/overview-lifecycle.tsx`
- **Form Component**: `src/pages/buckets/manage/overview/lifecycle-rule-form.tsx`
- **Hooks**: `src/pages/buckets/manage/hooks.ts` → `useLifecycleConfiguration`
- **Types**: `src/pages/buckets/types.ts`

## Lưu ý

1. **Garage Compatibility**: Đảm bảo Garage version hỗ trợ S3 Lifecycle API
2. **Permanent Deletion**: Objects bị xóa bởi lifecycle rules KHÔNG thể khôi phục
3. **Processing Time**: Lifecycle rules có thể mất vài phút để được áp dụng
4. **Multiple Rules**: Có thể có nhiều rules, nhưng nên tránh conflict (ví dụ: cùng prefix khác expiration)

## Roadmap/Future Enhancements

- [ ] Transition to different storage classes (nếu Garage hỗ trợ)
- [ ] Versioning support với NoncurrentVersionExpiration
- [ ] Tag-based filtering
- [ ] Lifecycle analytics và reporting
- [ ] Bulk import/export lifecycle configurations

## Tài liệu tham khảo

- [AWS S3 Lifecycle Documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-lifecycle-mgmt.html)
- [Garage Documentation](https://garagehq.deuxfleurs.fr/)
