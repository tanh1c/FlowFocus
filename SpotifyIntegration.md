# Hướng dẫn Tích hợp Spotify Real-time (Spotify Web Playback SDK)

Bạn hoàn toàn có thể tích hợp Spotify vào web app của mình mà không bị chặn bởi CORS (Cross-Origin Resource Sharing), miễn là bạn tuân thủ quy trình xác thực chuẩn của Spotify.

## 1. Tại sao không bị lỗi CORS?

Lỗi CORS thường xảy ra khi bạn dùng Javascript (client-side) để gọi trực tiếp các API của Spotify mà không có quyền.

Để giải quyết, chúng ta sử dụng cơ chế **OAuth 2.0** và **Spotify Web Playback SDK**:

1.  **OAuth 2.0**: Người dùng được chuyển hướng (redirect) sang trang đăng nhập của Spotify. Sau khi đăng nhập thành công, Spotify sẽ chuyển hướng ngược lại web của bạn kèm theo một `access_token`. Quá trình này diễn ra trên trình duyệt và được Spotify cho phép.
2.  **Web Playback SDK**: Đây là một thư viện Javascript do Spotify cung cấp. Khi bạn nạp thư viện này và cung cấp `access_token` hợp lệ, nó sẽ tạo ra một iframe hoặc kết nối socket an toàn tới máy chủ Spotify để phát nhạc. Spotify đã cấu hình server của họ để chấp nhận kết nối từ các domain được bạn đăng ký (Whitelist).

## 2. Các bước Cài đặt

Để tính năng này hoạt động, bạn cần **Spotify Premium** và thực hiện các bước sau:

### Bước 1: Tạo App trên Spotify Developer Dashboard
1.  Truy cập [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2.  Đăng nhập và nhấn **Create App**.
3.  Điền tên app (ví dụ: `Beeziee Clone`) và mô tả.
4.  Trong phần **Redirect URIs**, thêm:
    *   `http://localhost:3000/api/auth/callback/spotify` (hoặc đường dẫn callback bạn muốn dùng).
5.  Lưu lại `Client ID` và `Client Secret`.

### Bước 2: Cài đặt Thư viện
Bạn nên dùng `next-auth` để xử lý đăng nhập dễ dàng hơn.

```bash
npm install next-auth
```

### Bước 3: Cấu hình Biến môi trường (.env.local)

```env
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_random_secret_string
```

### Bước 4: Tạo Component Spotify Player
Sử dụng SDK để phát nhạc. Bạn sẽ cần tải script của Spotify SDK ở `layout.tsx` hoặc `useEffect`.

```tsx
// Ví dụ đơn giản
useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://sdk.scdn.co/spotify-player.js";
  script.async = true;
  document.body.appendChild(script);

  window.onSpotifyWebPlaybackSDKReady = () => {
    const player = new window.Spotify.Player({
      name: 'Beeziee Player',
      getOAuthToken: cb => { cb(token); }, // Token lấy từ NextAuth
      volume: 0.5
    });
    player.connect();
  };
}, [token]);
```

## Kết luận
Việc tích hợp Spotify là hoàn toàn khả thi và an toàn. Nếu bạn muốn triển khai tính năng này, hãy cung cấp `Client ID` (hoặc tự tạo theo hướng dẫn trên) và tôi sẽ giúp bạn viết code chi tiết!
