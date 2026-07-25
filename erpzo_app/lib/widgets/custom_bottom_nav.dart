import 'package:flutter/material.dart';

class CustomBottomNav extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onItemSelected;

  const CustomBottomNav({
    super.key,
    required this.selectedIndex,
    required this.onItemSelected,
  });

  @override
  Widget build(BuildContext context) {
    const Color primaryColor = Color(0xFF006B5C);
    const Color surfaceContainerLowest = Color(0xFFFFFFFF);
    final icons = [
      Icons.home_outlined,
      Icons.calendar_month,
      Icons.assignment_outlined,
      Icons.payments_outlined,
      Icons.person_outline,
    ];

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      decoration: BoxDecoration(
        color: surfaceContainerLowest.withAlpha(230),
        borderRadius: BorderRadius.circular(40),
        border: Border.all(color: Colors.white.withAlpha(50)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(25),
            blurRadius: 20,
            offset: const Offset(0, 8),
          )
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(icons.length, (index) {
          final isSelected = selectedIndex == index;
          return GestureDetector(
            onTap: () => onItemSelected(index),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected ? primaryColor : Colors.transparent,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icons[index],
                color: isSelected ? Colors.white : Colors.grey.shade600,
                size: 24,
              ),
            ),
          );
        }),
      ),
    );
  }
}
