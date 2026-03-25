import 'package:flutter/material.dart';

// ── MetricCard ───────────────────────────────────────────────
class MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final bool accent;
  final bool warn;
  final bool good;

  const MetricCard({
    super.key,
    required this.label,
    required this.value,
    this.accent = false,
    this.warn   = false,
    this.good   = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 130,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border(
          top:    BorderSide(color: Colors.grey.shade200),
          right:  BorderSide(color: Colors.grey.shade200),
          bottom: BorderSide(color: Colors.grey.shade200),
          left: BorderSide(
            width: accent ? 3 : 1,
            color: accent ? const Color(0xFF534AB7) : Colors.grey.shade200,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: Colors.grey,
              letterSpacing: 0.4,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: value.length > 8 ? 14 : 20,
              fontWeight: FontWeight.w500,
              color: warn ? const Color(0xFFE24B4A)
                   : good ? const Color(0xFF1D9E75)
                   : null,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ── InfoStrip ─────────────────────────────────────────────────
class InfoStrip extends StatelessWidget {
  final String text;
  final Color bg;
  final Color border;
  final Color textColor;

  const InfoStrip.blue(this.text, {super.key})
      : bg        = const Color(0xFFEEEDFE),
        border    = const Color(0xFFCECBF6),
        textColor = const Color(0xFF3C3489);

  const InfoStrip.green(this.text, {super.key})
      : bg        = const Color(0xFFEDFAF4),
        border    = const Color(0xFF9FDFC5),
        textColor = const Color(0xFF0F5C3F);

  const InfoStrip.red(this.text, {super.key})
      : bg        = const Color(0xFFFFF0F0),
        border    = const Color(0xFFF5C4C4),
        textColor = const Color(0xFF8B1A1A);

  const InfoStrip.amber(this.text, {super.key})
      : bg        = const Color(0xFFFDF4E0),
        border    = const Color(0xFFF5D98A),
        textColor = const Color(0xFF5A3C00);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 14),
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: border),
      ),
      child: Text(text, style: TextStyle(fontSize: 13, color: textColor, height: 1.7)),
    );
  }
}

// ── SectionTitle ──────────────────────────────────────────────
class SectionTitle extends StatelessWidget {
  final String title;
  const SectionTitle(this.title, {super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10, top: 2),
      child: Text(
        title,
        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
      ),
    );
  }
}

// ── DataTable card ────────────────────────────────────────────
class StatsTable extends StatelessWidget {
  final List<String>       headers;
  final List<List<String>> rows;
  final List<bool>?        highlightRow; // true = red highlight

  const StatsTable({
    super.key,
    required this.headers,
    required this.rows,
    this.highlightRow,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: DataTable(
          columnSpacing: 14,
          headingRowHeight: 36,
          dataRowMinHeight: 32,
          dataRowMaxHeight: 40,
          headingRowColor: WidgetStateProperty.all(const Color(0xFFFAFAF8)),
          columns: headers
              .map((h) => DataColumn(
                    label: Text(h,
                        style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey,
                            letterSpacing: 0.4)),
                  ))
              .toList(),
          rows: rows.asMap().entries.map((entry) {
            final isHL = highlightRow != null &&
                entry.key < highlightRow!.length &&
                highlightRow![entry.key];
            return DataRow(
              color: isHL
                  ? WidgetStateProperty.all(const Color(0xFFFFF0F0))
                  : null,
              cells: entry.value
                  .map((c) => DataCell(Text(c,
                      style: TextStyle(
                        fontSize: 13,
                        color: isHL ? const Color(0xFFE24B4A) : null,
                      ))))
                  .toList(),
            );
          }).toList(),
        ),
      ),
    );
  }
}

// ── Badge ─────────────────────────────────────────────────────
class StatBadge extends StatelessWidget {
  final String text;
  final Color bg;
  final Color fg;

  const StatBadge.red(this.text, {super.key})
      : bg = const Color(0xFFFAECE7), fg = const Color(0xFF993C1D);
  const StatBadge.green(this.text, {super.key})
      : bg = const Color(0xFFEAF3DE), fg = const Color(0xFF3B6D11);
  const StatBadge.blue(this.text, {super.key})
      : bg = const Color(0xFFE6F1FB), fg = const Color(0xFF0C447C);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
      child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w500, color: fg)),
    );
  }
}
