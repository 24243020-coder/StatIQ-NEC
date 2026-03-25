import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'home_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {

  late AnimationController _logoCtrl;
  late AnimationController _textCtrl;
  late AnimationController _ballCtrl;
  late Animation<double> _logoScale;
  late Animation<double> _logoFade;
  late Animation<double> _textFade;
  late Animation<Offset> _textSlide;

  @override
  void initState() {
    super.initState();

    _logoCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 900));
    _textCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 700));
    _ballCtrl = AnimationController(
        vsync: this, duration: const Duration(seconds: 2))
      ..repeat();

    _logoScale = Tween<double>(begin: 0.3, end: 1.0).animate(
        CurvedAnimation(parent: _logoCtrl, curve: Curves.elasticOut));
    _logoFade = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _logoCtrl, curve: const Interval(0.0, 0.5)));
    _textFade = Tween<double>(begin: 0.0, end: 1.0).animate(
        CurvedAnimation(parent: _textCtrl, curve: Curves.easeIn));
    _textSlide = Tween<Offset>(
            begin: const Offset(0, 0.3), end: Offset.zero)
        .animate(CurvedAnimation(parent: _textCtrl, curve: Curves.easeOut));

    _logoCtrl.forward();
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) _textCtrl.forward();
    });

    Timer(const Duration(seconds: 3), () {
      if (mounted) {
        Navigator.pushReplacement(context,
            PageRouteBuilder(
              pageBuilder: (_, __, ___) => const HomeScreen(),
              transitionsBuilder: (_, anim, __, child) =>
                  FadeTransition(opacity: anim, child: child),
              transitionDuration: const Duration(milliseconds: 500),
            ));
      }
    });
  }

  @override
  void dispose() {
    _logoCtrl.dispose();
    _textCtrl.dispose();
    _ballCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0a1628),
      body: Stack(
        children: [
          // Animated background balls
          ...List.generate(12, (i) => _Ball(index: i, ctrl: _ballCtrl)),

          // Main content
          Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // College logo circle
                ScaleTransition(
                  scale: _logoScale,
                  child: FadeTransition(
                    opacity: _logoFade,
                    child: Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        border: Border.all(color: const Color(0xFFc9a84c), width: 3),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFFc9a84c).withOpacity(0.4),
                            blurRadius: 24,
                            spreadRadius: 4,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/images/nec_logo.png',
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => const Icon(
                            Icons.school,
                            size: 52,
                            color: Color(0xFF0a1628),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                const SizedBox(height: 24),

                // Gold divider
                FadeTransition(
                  opacity: _textFade,
                  child: Container(
                    width: 80,
                    height: 1.5,
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(colors: [
                        Colors.transparent,
                        Color(0xFFc9a84c),
                        Colors.transparent,
                      ]),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // College name
                SlideTransition(
                  position: _textSlide,
                  child: FadeTransition(
                    opacity: _textFade,
                    child: Column(
                      children: [
                        Text(
                          'National Engineering College',
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: 0.3,
                          ),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'K.R. Nagar, Kovilpatti • Estd: 1984',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: const Color(0xFFe8c96d),
                            letterSpacing: 0.5,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 16, vertical: 6),
                          decoration: BoxDecoration(
                            border: Border.all(
                                color: const Color(0xFFc9a84c).withOpacity(0.4)),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Dept. of AI & Data Science',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              color: const Color(0xFFc9a84c),
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        const SizedBox(height: 32),
                        // App name
                        Text(
                          'StatIQ',
                          style: GoogleFonts.playfairDisplay(
                            fontSize: 42,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                            letterSpacing: 1,
                          ),
                        ),
                        Text(
                          'Statistics Calculator',
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.6),
                            letterSpacing: 0.3,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Course Code: 23AD46C',
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: const Color(0xFFe8c96d),
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),

                const SizedBox(height: 60),

                // Loading indicator
                FadeTransition(
                  opacity: _textFade,
                  child: SizedBox(
                    width: 120,
                    child: LinearProgressIndicator(
                      backgroundColor:
                          const Color(0xFFc9a84c).withOpacity(0.2),
                      valueColor: const AlwaysStoppedAnimation<Color>(
                          Color(0xFFc9a84c)),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Floating golden ball widget
class _Ball extends StatelessWidget {
  final int index;
  final AnimationController ctrl;

  const _Ball({required this.index, required this.ctrl});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final positions = [
      [0.1, 0.1], [0.8, 0.15], [0.3, 0.8], [0.7, 0.75],
      [0.05, 0.5], [0.9, 0.45], [0.5, 0.05], [0.45, 0.92],
      [0.2, 0.35], [0.75, 0.55], [0.6, 0.25], [0.15, 0.68],
    ];
    final pos = positions[index % positions.length];
    final r = (index % 3 + 1) * 3.0;

    return AnimatedBuilder(
      animation: ctrl,
      builder: (_, __) {
        final t = (ctrl.value + index * 0.08) % 1.0;
        final dy = -20 * (t < 0.5 ? t * 2 : (1 - t) * 2);
        return Positioned(
          left: pos[0] * size.width,
          top: pos[1] * size.height + dy,
          child: Container(
            width: r * 2,
            height: r * 2,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFc9a84c).withOpacity(0.25 + index * 0.02),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFFc9a84c).withOpacity(0.15),
                  blurRadius: r * 2,
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
