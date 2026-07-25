import 'package:flutter/material.dart';

class CustomAppBar extends StatelessWidget {
  final VoidCallback? onMenuPressed;
  final String? title;
  final bool showBackButton;
  final bool isTeacher;
  final Widget? trailing;

  const CustomAppBar({
    super.key, 
    this.onMenuPressed, 
    this.title,
    this.showBackButton = false,
    this.isTeacher = false,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    const Color primaryColor = Color(0xFF006B5C);
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: Icon(showBackButton ? Icons.arrow_back : Icons.grid_view, color: primaryColor, size: 28),
            onPressed: showBackButton 
                ? () => Navigator.of(context).pushNamedAndRemoveUntil(
                    isTeacher ? '/teacher_dashboard' : '/dashboard', 
                    (route) => false,
                  )
                : onMenuPressed,
          ),
          Text(
            title ?? 'iNiLabs School',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
              color: Color(0xFF1A1C1E),
            ),
          ),
          if (trailing != null)
            trailing!
          else if (showBackButton)
            IconButton(
              icon: const Icon(Icons.person_outline, color: primaryColor, size: 28),
              onPressed: () => Navigator.of(context).pushReplacementNamed(isTeacher ? '/teacher_own_profile' : '/profile'),
            )
          else
            GestureDetector(
              onTap: () {
                Navigator.of(context).pushReplacementNamed(isTeacher ? '/teacher_own_profile' : '/profile');
              },
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 2),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(13),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                  image: const DecorationImage(
                    image: NetworkImage(
                        'https://lh3.googleusercontent.com/aida-public/AB6AXuCcTVQ55-LqWVrfBiaX87Kci_GwPVlKS0krtPHuSGG3jmN2SpoFOmUzEiiMXUNxR9zHcKWsdp2FWcg2NHaBJDEFnc10-0H9DseieBOuGSZMOafY7GA6olBvNYNe2UkEIIK7MRpQAWnMATzyd9cfi8ggDo9PCCOTic8osSEjM7_2N0NwaqvtZ5IBl5m_LvXVqU99Q0BAQBOTlwmd3Evs_P1qb-70W-s6xPtr2HQlKa7tU3sowUN-OLiGyGpoM_TxMYZeCKjudLpUeKg1'),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
