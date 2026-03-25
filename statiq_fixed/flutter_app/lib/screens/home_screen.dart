import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:webview_flutter/webview_flutter.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;
  bool _hasError = false;
  int _loadProgress = 0;

  // ← Your Render URL
  static const String _appUrl = 'https://statiq-calculator.onrender.com';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0xFF0a1628))
      ..setNavigationDelegate(NavigationDelegate(
        onProgress: (p) => setState(() => _loadProgress = p),
        onPageStarted: (_) => setState(() { _isLoading = true; _hasError = false; }),
        onPageFinished: (_) => setState(() => _isLoading = false),
        onWebResourceError: (_) => setState(() { _hasError = true; _isLoading = false; }),
      ))
      ..loadRequest(Uri.parse(_appUrl));
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async {
        if (await _controller.canGoBack()) {
          _controller.goBack();
          return false;
        }
        return true;
      },
      child: Scaffold(
        backgroundColor: const Color(0xFF0a1628),
        appBar: _buildAppBar(),
        body: _buildBody(),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: const Color(0xFF0a1628),
      elevation: 0,
      titleSpacing: 12,
      title: Row(children: [
        Container(
          width: 28, height: 28,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: Colors.white,
          ),
          child: ClipOval(child: Image.asset(
            'assets/images/nec_logo.png', fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(Icons.school, size: 16, color: Color(0xFF0a1628)),
          )),
        ),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
          Text('StatIQ', style: GoogleFonts.playfairDisplay(
            fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
          Text('23AD46C · NEC', style: GoogleFonts.inter(
            fontSize: 9, color: const Color(0xFFe8c96d), letterSpacing: 0.4)),
        ]),
      ]),
      actions: [
        if (_isLoading)
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: Center(child: SizedBox(
              width: 18, height: 18,
              child: CircularProgressIndicator(
                value: _loadProgress / 100,
                strokeWidth: 2,
                color: const Color(0xFFc9a84c),
              ),
            )),
          ),
        IconButton(
          icon: const Icon(Icons.refresh, color: Color(0xFFc9a84c), size: 20),
          onPressed: () => _controller.reload(),
          tooltip: 'Reload',
        ),
      ],
      bottom: _isLoading ? PreferredSize(
        preferredSize: const Size.fromHeight(2),
        child: LinearProgressIndicator(
          value: _loadProgress / 100,
          backgroundColor: Colors.white10,
          valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFc9a84c)),
          minHeight: 2,
        ),
      ) : null,
    );
  }

  Widget _buildBody() {
    if (_hasError) return _buildError();
    return WebViewWidget(controller: _controller);
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Icon(Icons.wifi_off, size: 64, color: Color(0xFFc9a84c)),
          const SizedBox(height: 20),
          Text('No Internet Connection',
            style: GoogleFonts.playfairDisplay(fontSize: 20, fontWeight: FontWeight.w700, color: Colors.white)),
          const SizedBox(height: 10),
          Text('Please check your internet and try again',
            style: GoogleFonts.inter(fontSize: 14, color: Colors.white54),
            textAlign: TextAlign.center),
          const SizedBox(height: 28),
          ElevatedButton.icon(
            onPressed: () => _controller.reload(),
            icon: const Icon(Icons.refresh),
            label: const Text('Try Again'),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFc9a84c),
              foregroundColor: const Color(0xFF0a1628),
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            ),
          ),
        ]),
      ),
    );
  }
}
