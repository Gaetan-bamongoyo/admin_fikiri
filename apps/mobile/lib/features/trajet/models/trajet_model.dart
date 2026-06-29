import 'package:flutter/material.dart';

class TrajetModel {
  final String id;
  final String label;
  final String? category;
  final String address;
  final double latitude;
  final double longitude;
  final int sortOrder;

  const TrajetModel({
    required this.id,
    required this.label,
    required this.category,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.sortOrder,
  });

  factory TrajetModel.fromJson(Map<String, dynamic> json) {
    return TrajetModel(
      id: json['id']?.toString() ?? '',
      label: json['label']?.toString() ?? '',
      category: json['category']?.toString(),
      address: json['address']?.toString() ?? '',
      latitude: _parseCoordinate(json['latitude']),
      longitude: _parseCoordinate(json['longitude']),
      sortOrder: json['sortOrder'] as int? ?? 0,
    );
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'label': label,
      if (category != null) 'category': category,
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      if (sortOrder > 0) 'sortOrder': sortOrder,
    };
  }

  static double _parseCoordinate(dynamic value) {
    if (value is num) return value.toDouble();
    return double.tryParse(value?.toString().replaceAll(',', '.') ?? '') ?? 0;
  }

  static String? categoryFromLabel(String label) {
    return switch (label) {
      'Maison' => 'home',
      'Travail' => 'work',
      'Église' => 'church',
      'Marché' => 'market',
      _ => 'other',
    };
  }

  static IconData iconForCategory(String? category) {
    return switch (category) {
      'home' => Icons.home_rounded,
      'work' => Icons.work_rounded,
      'church' => Icons.church_rounded,
      'market' => Icons.shopping_bag_rounded,
      _ => Icons.place_rounded,
    };
  }
}
