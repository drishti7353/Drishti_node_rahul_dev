// import 'package:dio/dio.dart';
// import 'package:shared_preferences/shared_preferences.dart';

// class TokenService {
//   final Dio _dio;
//   final SharedPreferences _prefs;
//   static const String _accessTokenKey = 'access_token';
//   static const String _refreshTokenKey = 'refresh_token';

//   TokenService(this._dio, this._prefs);

//   Future<String?> refreshAccessToken() async {
//     try {
//       final refreshToken = _prefs.getString(_refreshTokenKey);
//       if (refreshToken == null) return null;

//       final response = await _dio.post('/user/refresh-token', data: {
//         'refreshToken': refreshToken,
//       });

//       if (response.statusCode == 200) {
//         final newAccessToken = response.data['accessToken'];
//         final newRefreshToken = response.data['refreshToken'];
//         await _prefs.setString(_accessTokenKey, newAccessToken);
//         await _prefs.setString(_refreshTokenKey, newRefreshToken);
//         return newAccessToken;
//       }
//       return null;
//     } catch (e) {
//       print('Error refreshing token: $e');
//       return null;
//     }
//   }

//   Future<void> saveTokens({
//     required String accessToken,
//     required String refreshToken,
//   }) async {
//     await _prefs.setString(_accessTokenKey, accessToken);
//     await _prefs.setString(_refreshTokenKey, refreshToken);
//   }

//   Future<void> clearTokens() async {
//     await _prefs.remove(_accessTokenKey);
//     await _prefs.remove(_refreshTokenKey);
//   }
// }
