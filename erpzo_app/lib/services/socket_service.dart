import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static final SocketService _instance = SocketService._internal();
  IO.Socket? socket;

  // Use your live Render backend URL
  static const String _serverUrl = 'https://school-backend-your-render-url.onrender.com';

  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  void initSocket() {
    if (socket != null && socket!.connected) return;

    // Use a placeholder or the actual backend URL here
    // In a real scenario, you might want to fetch this from an environment variable or config
    socket = IO.io(_serverUrl, IO.OptionBuilder()
      .setTransports(['websocket']) // for Flutter or Web
      .disableAutoConnect()  // disable auto-connection
      .build()
    );

    socket!.connect();

    socket!.onConnect((_) {
      print('Socket connected: ${socket!.id}');
    });

    socket!.onDisconnect((_) {
      print('Socket disconnected');
    });
    
    socket!.onError((err) {
      print('Socket error: $err');
    });
  }

  void on(String event, Function(dynamic) callback) {
    socket?.on(event, callback);
  }

  void off(String event) {
    socket?.off(event);
  }

  void emit(String event, dynamic data) {
    socket?.emit(event, data);
  }

  void disconnect() {
    socket?.disconnect();
  }
}
