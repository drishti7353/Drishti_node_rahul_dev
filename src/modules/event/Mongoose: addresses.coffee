# Mongoose: addresses.createIndex({ latlong: '2dsphere' }, { background: true })
# Mongoose: events.createIndex({ location: '2dsphere' }, { background: true })
# Mongoose: users.createIndex({ userName: 1 }, { unique: true, sparse: true, background: true })
# Mongoose: users.createIndex({ geometry: '2dsphere' }, { background: true })
# Auth middleware - Received headers: {
#   'user-agent': 'Dart/3.7 (dart:io)',
#   'content-type': 'application/json',
#   'accept-encoding': 'gzip',
#   authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8',
#   host: '52.66.64.109:8080'
# }
# Auth middleware - Authorization header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Extracted token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Verified token payload: {
#   id: '68387b5e263c15997a62c736',
#   type: 'access',
#   iat: 1748670644,
#   exp: 1756446644
# }
# Mongoose: users.findOne({ _id: new ObjectId("68387b5e263c15997a62c736") }, {})
# Auth middleware - Found user: new ObjectId("68387b5e263c15997a62c736")
# Getting user profile for: 68387b5e263c15997a62c736
# Mongoose: users.findOne({ _id: new ObjectId("68387b5e263c15997a62c736") }, { projection: { refreshTokens: 0, password: 0 } })
# Found user from DB: {
#   _id: new ObjectId("68387b5e263c15997a62c736"),
#   profileImage: 'https://storage.googleapis.com/srisridrishti-c1673.firebasestorage.app/profiles/68387b5e263c15997a62c736/1748539002358_30739bdc-4e10-4516-b0b0-03eb42470acb.jpg',
#   name: 'dsa',
#   email: 'rah@gmail.com',
#   mobileNo: '9967587610',
#   bio: '',
#   teacherId: 'ad',
#   teacherIdCard: 'https://storage.googleapis.com/srisridrishti-c1673.firebasestorage.app/teacher_ids/68387b5e263c15997a62c736/1748560678902_24a554db-f42b-4d10-a30f-4dd114008984.jpeg',
#   deviceTokens: [
#     'cClIzuqqQQevQ74yqfDQd1:APA91bHe3y5iCecmarJyhNT-857ynZthhWBCaQM4_dMx8L0Pm66dbjfkSDzvptUh_C1un8zsTaLjDe-gM-SIZSmTIkkyQdoVHowILGrpTlUeWGsX4NTT-bg',
#     'e0KgGcofShm_tKbsR5GhW-:APA91bENBMI9uUa_ghBx6HnsC2iVJwFxHhd0YEe4p0xZQltKvVWa6zSDQaNeGpYBx3lw6Q4eWxoN2MP0Z_c49pG1z_oLO8FCOW3NkIrSoiwBEunZb6IkUVI',
#     'cdGmrtysRAO6QcStHpfPen:APA91bHgkOxcKyifR9n6jl4hdOPa8zUmkccgA1I4m1dkf0pXLuvaKOgR_CTj-WRGoilNpW0L08JHaRbE2YI1XfLrYFxvw2SwmpAKA20dnNonB0PanASMXXM',
#     'cUjwae3USHe40Piet1uIpF:APA91bEjVV2WcglK7S5OsIs82TO-57JW_K2nr2C34JP_t2bvn5meFKuGQGkqPcXAHHGAvn8TkPMan06j7P5tPmmGUUnmvwZNKLjieraPawtOIpLPFZHXtbg',
#     'eOOWoJqRTqiplD5AKPMHOc:APA91bETtn76DZZF231AptDDaAhZjXUJ5eFK3Nc04GFF5U98-mVxKxxHoTLjwNU-tsNn9Pr6y-1KC-dqguyZLZ5G8rWjRG3Ea9_0Tkvslhj1a2rZxb8Zn5k',
#     'cI4zsvJ-TMKN-ge2ut4byo:APA91bEDLjtDRD3N8tn8a4nIZ0li7hEvWQO7fT9UvqrhPv53jp-ErjHVE2tAot8MGL-yGQ1tHzULIqHtrY0YUy9Zk9Y71-6ZdX02kJmpuIHvhYgvMRnX8nc',
#     'c8IbjJAjSW6LZzmW4vjNVy:APA91bFaLX70co7H9RjuoSnZbun2AZO1wXqLGP3h70iTizC80P_QYCZpDXHtFaGkW1jWrACgaSbTjI8BNXbPl-vhAHrG4P5EoHmzone6PdePpTXgfHSJo7w',
#     'fHpmyENJRAq5MYxjjJUdki:APA91bFXC-lx5dDiAOZVX9eQ_zO-g8JJkXhpWWLI7vt2O1THMz-ZL7DZRvpYIjkP1Flb-RFj38sxxUH81QiGVAKjh3kQ8Kyf9K3sq6dO4gP0ux4ZIc3YOHo',
#     'f5_Mp-5LTyORI8baGZZ0ZW:APA91bHt_AWKnaOKvcD2rOdRdNbnm7RVNO4xG9SY3cye3oDgsLG3UsnGcbOquDPDRm6TeJ8r51ckTO7Ls3cvhpooienFC9_R2smhCYrOw7CPTfoKxBV_8zw',
#     'dVzO0Fc6RAyB4kPkxaymRg:APA91bEgB4KecTJ2AvYHm6C2CCDZsgcVhe52n4_TKUPkVszhJk1xV5iiZAak6KhhjRERgRCdVcVJRPup0vtWrK1m1u8U4dQLwbWEv-4ECMGlJGC8JZTsUmU',
#     'dBX3uq_ETMKMr57R8KdBEZ:APA91bGW-ljOAUJBk6urrw-0IfplE44XLKLoRIMLJvEap2gO2WcBis18LUiC4VBKv3-vVvmjcd8EKDVulwCtg4fcEsZ-Y5U0qL6dhGMDbU5UVs57cNDYR5c',
#     'c4uLjdAaSxaMktn9CtTdtm:APA91bGRDHHwUxfY5Oln2OH6E9B1-9RPso-jadaZLNsbVF6MytbjmEOYEQK1h-h39iyo63bekcAPPZA76_a_r-mxkeSxyiFO2jDQyHcm-Lr1kTQK4XyPZpE',
#     'fDL1EgYiQ-Sbjt64EQRkSI:APA91bHVgnM3VEnDNPZW2D4PUMG_a8oYLTxWHvImHpzg8f1yuLTrbwhCYpzuwcouWyGejs9zsk1B7vfCEyCzcZnug9dws-bcf80yxEP0C9QZwHSnH48fqp0',
#     'fqF3noPERQ2nLHn-AGctOI:APA91bEtsHw1c5nykIyVurh18KN5OfcKTv1ts539RjvvC_KSPcplCZLBUgTCJTBgmQJD9r3j7Ik7xs2gWfI7H7k0zZDMzPPmS1f1Gan6Qe-h_WAsBpJXnR8'
#   ],
#   countryCode: '+91',
#   isOnboarded: true,
#   teacherRoleApproved: 'accepted',
#   geometry: { type: 'Point', coordinates: [ -122.084, 37.4219983 ] },
#   role: 'teacher',
#   nearByVisible: true,
#   locationSharing: true,
#   createdAt: 2025-05-29T15:21:02.407Z,
#   updatedAt: 2025-06-03T05:15:54.688Z,
#   __v: 28,
#   instagramUrl: '',
#   userName: 'rahull32',
#   xUrl: '',
#   youtubeUrl: '',
#   location: 'Regular update'
# }
# Raw user document from DB: {
#   _id: new ObjectId("68387b5e263c15997a62c736"),
#   profileImage: 'https://storage.googleapis.com/srisridrishti-c1673.firebasestorage.app/profiles/68387b5e263c15997a62c736/1748539002358_30739bdc-4e10-4516-b0b0-03eb42470acb.jpg',
#   name: 'dsa',
#   email: 'rah@gmail.com',
#   mobileNo: '9967587610',
#   bio: '',
#   teacherId: 'ad',
#   teacherIdCard: 'https://storage.googleapis.com/srisridrishti-c1673.firebasestorage.app/teacher_ids/68387b5e263c15997a62c736/1748560678902_24a554db-f42b-4d10-a30f-4dd114008984.jpeg',
#   deviceTokens: [
#     'cClIzuqqQQevQ74yqfDQd1:APA91bHe3y5iCecmarJyhNT-857ynZthhWBCaQM4_dMx8L0Pm66dbjfkSDzvptUh_C1un8zsTaLjDe-gM-SIZSmTIkkyQdoVHowILGrpTlUeWGsX4NTT-bg',
#     'e0KgGcofShm_tKbsR5GhW-:APA91bENBMI9uUa_ghBx6HnsC2iVJwFxHhd0YEe4p0xZQltKvVWa6zSDQaNeGpYBx3lw6Q4eWxoN2MP0Z_c49pG1z_oLO8FCOW3NkIrSoiwBEunZb6IkUVI',
#     'cdGmrtysRAO6QcStHpfPen:APA91bHgkOxcKyifR9n6jl4hdOPa8zUmkccgA1I4m1dkf0pXLuvaKOgR_CTj-WRGoilNpW0L08JHaRbE2YI1XfLrYFxvw2SwmpAKA20dnNonB0PanASMXXM',
#     'cUjwae3USHe40Piet1uIpF:APA91bEjVV2WcglK7S5OsIs82TO-57JW_K2nr2C34JP_t2bvn5meFKuGQGkqPcXAHHGAvn8TkPMan06j7P5tPmmGUUnmvwZNKLjieraPawtOIpLPFZHXtbg',
#     'eOOWoJqRTqiplD5AKPMHOc:APA91bETtn76DZZF231AptDDaAhZjXUJ5eFK3Nc04GFF5U98-mVxKxxHoTLjwNU-tsNn9Pr6y-1KC-dqguyZLZ5G8rWjRG3Ea9_0Tkvslhj1a2rZxb8Zn5k',
#     'cI4zsvJ-TMKN-ge2ut4byo:APA91bEDLjtDRD3N8tn8a4nIZ0li7hEvWQO7fT9UvqrhPv53jp-ErjHVE2tAot8MGL-yGQ1tHzULIqHtrY0YUy9Zk9Y71-6ZdX02kJmpuIHvhYgvMRnX8nc',
#     'c8IbjJAjSW6LZzmW4vjNVy:APA91bFaLX70co7H9RjuoSnZbun2AZO1wXqLGP3h70iTizC80P_QYCZpDXHtFaGkW1jWrACgaSbTjI8BNXbPl-vhAHrG4P5EoHmzone6PdePpTXgfHSJo7w',
#     'fHpmyENJRAq5MYxjjJUdki:APA91bFXC-lx5dDiAOZVX9eQ_zO-g8JJkXhpWWLI7vt2O1THMz-ZL7DZRvpYIjkP1Flb-RFj38sxxUH81QiGVAKjh3kQ8Kyf9K3sq6dO4gP0ux4ZIc3YOHo',
#     'f5_Mp-5LTyORI8baGZZ0ZW:APA91bHt_AWKnaOKvcD2rOdRdNbnm7RVNO4xG9SY3cye3oDgsLG3UsnGcbOquDPDRm6TeJ8r51ckTO7Ls3cvhpooienFC9_R2smhCYrOw7CPTfoKxBV_8zw',
#     'dVzO0Fc6RAyB4kPkxaymRg:APA91bEgB4KecTJ2AvYHm6C2CCDZsgcVhe52n4_TKUPkVszhJk1xV5iiZAak6KhhjRERgRCdVcVJRPup0vtWrK1m1u8U4dQLwbWEv-4ECMGlJGC8JZTsUmU',
#     'dBX3uq_ETMKMr57R8KdBEZ:APA91bGW-ljOAUJBk6urrw-0IfplE44XLKLoRIMLJvEap2gO2WcBis18LUiC4VBKv3-vVvmjcd8EKDVulwCtg4fcEsZ-Y5U0qL6dhGMDbU5UVs57cNDYR5c',
#     'c4uLjdAaSxaMktn9CtTdtm:APA91bGRDHHwUxfY5Oln2OH6E9B1-9RPso-jadaZLNsbVF6MytbjmEOYEQK1h-h39iyo63bekcAPPZA76_a_r-mxkeSxyiFO2jDQyHcm-Lr1kTQK4XyPZpE',
#     'fDL1EgYiQ-Sbjt64EQRkSI:APA91bHVgnM3VEnDNPZW2D4PUMG_a8oYLTxWHvImHpzg8f1yuLTrbwhCYpzuwcouWyGejs9zsk1B7vfCEyCzcZnug9dws-bcf80yxEP0C9QZwHSnH48fqp0',
#     'fqF3noPERQ2nLHn-AGctOI:APA91bEtsHw1c5nykIyVurh18KN5OfcKTv1ts539RjvvC_KSPcplCZLBUgTCJTBgmQJD9r3j7Ik7xs2gWfI7H7k0zZDMzPPmS1f1Gan6Qe-h_WAsBpJXnR8'
#   ],
#   countryCode: '+91',
#   isOnboarded: true,
#   teacherRoleApproved: 'accepted',
#   geometry: { type: 'Point', coordinates: [ -122.084, 37.4219983 ] },
#   role: 'teacher',
#   nearByVisible: true,
#   locationSharing: true,
#   createdAt: 2025-05-29T15:21:02.407Z,
#   updatedAt: 2025-06-03T05:15:54.688Z,
#   __v: 28,
#   instagramUrl: '',
#   userName: 'rahull32',
#   xUrl: '',
#   youtubeUrl: '',
#   location: 'Regular update'
# }
# Sending transformed user data: {
#   _id: '68387b5e263c15997a62c736',
#   id: '68387b5e263c15997a62c736',
#   mobileNo: '9967587610',
#   countryCode: '+91',
#   deviceTokens: [
#     'cClIzuqqQQevQ74yqfDQd1:APA91bHe3y5iCecmarJyhNT-857ynZthhWBCaQM4_dMx8L0Pm66dbjfkSDzvptUh_C1un8zsTaLjDe-gM-SIZSmTIkkyQdoVHowILGrpTlUeWGsX4NTT-bg',
#     'e0KgGcofShm_tKbsR5GhW-:APA91bENBMI9uUa_ghBx6HnsC2iVJwFxHhd0YEe4p0xZQltKvVWa6zSDQaNeGpYBx3lw6Q4eWxoN2MP0Z_c49pG1z_oLO8FCOW3NkIrSoiwBEunZb6IkUVI',
#     'cdGmrtysRAO6QcStHpfPen:APA91bHgkOxcKyifR9n6jl4hdOPa8zUmkccgA1I4m1dkf0pXLuvaKOgR_CTj-WRGoilNpW0L08JHaRbE2YI1XfLrYFxvw2SwmpAKA20dnNonB0PanASMXXM',
#     'cUjwae3USHe40Piet1uIpF:APA91bEjVV2WcglK7S5OsIs82TO-57JW_K2nr2C34JP_t2bvn5meFKuGQGkqPcXAHHGAvn8TkPMan06j7P5tPmmGUUnmvwZNKLjieraPawtOIpLPFZHXtbg',
#     'eOOWoJqRTqiplD5AKPMHOc:APA91bETtn76DZZF231AptDDaAhZjXUJ5eFK3Nc04GFF5U98-mVxKxxHoTLjwNU-tsNn9Pr6y-1KC-dqguyZLZ5G8rWjRG3Ea9_0Tkvslhj1a2rZxb8Zn5k',
#     'cI4zsvJ-TMKN-ge2ut4byo:APA91bEDLjtDRD3N8tn8a4nIZ0li7hEvWQO7fT9UvqrhPv53jp-ErjHVE2tAot8MGL-yGQ1tHzULIqHtrY0YUy9Zk9Y71-6ZdX02kJmpuIHvhYgvMRnX8nc',
#     'c8IbjJAjSW6LZzmW4vjNVy:APA91bFaLX70co7H9RjuoSnZbun2AZO1wXqLGP3h70iTizC80P_QYCZpDXHtFaGkW1jWrACgaSbTjI8BNXbPl-vhAHrG4P5EoHmzone6PdePpTXgfHSJo7w',
#     'fHpmyENJRAq5MYxjjJUdki:APA91bFXC-lx5dDiAOZVX9eQ_zO-g8JJkXhpWWLI7vt2O1THMz-ZL7DZRvpYIjkP1Flb-RFj38sxxUH81QiGVAKjh3kQ8Kyf9K3sq6dO4gP0ux4ZIc3YOHo',
#     'f5_Mp-5LTyORI8baGZZ0ZW:APA91bHt_AWKnaOKvcD2rOdRdNbnm7RVNO4xG9SY3cye3oDgsLG3UsnGcbOquDPDRm6TeJ8r51ckTO7Ls3cvhpooienFC9_R2smhCYrOw7CPTfoKxBV_8zw',
#     'dVzO0Fc6RAyB4kPkxaymRg:APA91bEgB4KecTJ2AvYHm6C2CCDZsgcVhe52n4_TKUPkVszhJk1xV5iiZAak6KhhjRERgRCdVcVJRPup0vtWrK1m1u8U4dQLwbWEv-4ECMGlJGC8JZTsUmU',
#     'dBX3uq_ETMKMr57R8KdBEZ:APA91bGW-ljOAUJBk6urrw-0IfplE44XLKLoRIMLJvEap2gO2WcBis18LUiC4VBKv3-vVvmjcd8EKDVulwCtg4fcEsZ-Y5U0qL6dhGMDbU5UVs57cNDYR5c',
#     'c4uLjdAaSxaMktn9CtTdtm:APA91bGRDHHwUxfY5Oln2OH6E9B1-9RPso-jadaZLNsbVF6MytbjmEOYEQK1h-h39iyo63bekcAPPZA76_a_r-mxkeSxyiFO2jDQyHcm-Lr1kTQK4XyPZpE',
#     'fDL1EgYiQ-Sbjt64EQRkSI:APA91bHVgnM3VEnDNPZW2D4PUMG_a8oYLTxWHvImHpzg8f1yuLTrbwhCYpzuwcouWyGejs9zsk1B7vfCEyCzcZnug9dws-bcf80yxEP0C9QZwHSnH48fqp0',
#     'fqF3noPERQ2nLHn-AGctOI:APA91bEtsHw1c5nykIyVurh18KN5OfcKTv1ts539RjvvC_KSPcplCZLBUgTCJTBgmQJD9r3j7Ik7xs2gWfI7H7k0zZDMzPPmS1f1Gan6Qe-h_WAsBpJXnR8'
#   ],
#   isOnboarded: true,
#   createdAt: '2025-05-29T15:21:02.407Z',
#   updatedAt: '2025-06-03T05:15:54.688Z',
#   role: 'teacher',
#   email: 'rah@gmail.com',
#   name: 'dsa',
#   profileImage: 'https://storage.googleapis.com/srisridrishti-c1673.firebasestorage.app/profiles/68387b5e263c15997a62c736/1748539002358_30739bdc-4e10-4516-b0b0-03eb42470acb.jpg',
#   teacherRoleApproved: 'accepted',
#   userName: 'rahull32',
#   teacherId: 'ad',
#   teacherIdCard: 'https://storage.googleapis.com/srisridrishti-c1673.firebasestorage.app/teacher_ids/68387b5e263c15997a62c736/1748560678902_24a554db-f42b-4d10-a30f-4dd114008984.jpeg',
#   bio: '',
#   youtubeUrl: '',
#   xUrl: '',
#   instagramUrl: '',
#   nearByVisible: true,
#   locationSharing: true,
#   geometry: { type: 'Point', coordinates: [ -122.084, 37.4219983 ] }
# }
# Processed user data for response: {
#   _id: '68387b5e263c15997a62c736',
#   id: '68387b5e263c15997a62c736',
#   mobileNo: '9967587610',
#   countryCode: '+91',
#   deviceTokens: [
#     'cClIzuqqQQevQ74yqfDQd1:APA91bHe3y5iCecmarJyhNT-857ynZthhWBCaQM4_dMx8L0Pm66dbjfkSDzvptUh_C1un8zsTaLjDe-gM-SIZSmTIkkyQdoVHowILGrpTlUeWGsX4NTT-bg',
#     'e0KgGcofShm_tKbsR5GhW-:APA91bENBMI9uUa_ghBx6HnsC2iVJwFxHhd0YEe4p0xZQltKvVWa6zSDQaNeGpYBx3lw6Q4eWxoN2MP0Z_c49pG1z_oLO8FCOW3NkIrSoiwBEunZb6IkUVI',
#     'cdGmrtysRAO6QcStHpfPen:APA91bHgkOxcKyifR9n6jl4hdOPa8zUmkccgA1I4m1dkf0pXLuvaKOgR_CTj-WRGoilNpW0L08JHaRbE2YI1XfLrYFxvw2SwmpAKA20dnNonB0PanASMXXM',
#     'cUjwae3USHe40Piet1uIpF:APA91bEjVV2WcglK7S5OsIs82TO-57JW_K2nr2C34JP_t2bvn5meFKuGQGkqPcXAHHGAvn8TkPMan06j7P5tPmmGUUnmvwZNKLjieraPawtOIpLPFZHXtbg',
#     'eOOWoJqRTqiplD5AKPMHOc:APA91bETtn76DZZF231AptDDaAhZjXUJ5eFK3Nc04GFF5U98-mVxKxxHoTLjwNU-tsNn9Pr6y-1KC-dqguyZLZ5G8rWjRG3Ea9_0Tkvslhj1a2rZxb8Zn5k',
#     'cI4zsvJ-TMKN-ge2ut4byo:APA91bEDLjtDRD3N8tn8a4nIZ0li7hEvWQO7fT9UvqrhPv53jp-ErjHVE2tAot8MGL-yGQ1tHzULIqHtrY0YUy9Zk9Y71-6ZdX02kJmpuIHvhYgvMRnX8nc',
#     'c8IbjJAjSW6LZzmW4vjNVy:APA91bFaLX70co7H9RjuoSnZbun2AZO1wXqLGP3h70iTizC80P_QYCZpDXHtFaGkW1jWrACgaSbTjI8BNXbPl-vhAHrG4P5EoHmzone6PdePpTXgfHSJo7w',
#     'fHpmyENJRAq5MYxjjJUdki:APA91bFXC-lx5dDiAOZVX9eQ_zO-g8JJkXhpWWLI7vt2O1THMz-ZL7DZRvpYIjkP1Flb-RFj38sxxUH81QiGVAKjh3kQ8Kyf9K3sq6dO4gP0ux4ZIc3YOHo',
#     'f5_Mp-5LTyORI8baGZZ0ZW:APA91bHt_AWKnaOKvcD2rOdRdNbnm7RVNO4xG9SY3cye3oDgsLG3UsnGcbOquDPDRm6TeJ8r51ckTO7Ls3cvhpooienFC9_R2smhCYrOw7CPTfoKxBV_8zw',
#     'dVzO0Fc6RAyB4kPkxaymRg:APA91bEgB4KecTJ2AvYHm6C2CCDZsgcVhe52n4_TKUPkVszhJk1xV5iiZAak6KhhjRERgRCdVcVJRPup0vtWrK1m1u8U4dQLwbWEv-4ECMGlJGC8JZTsUmU',
#     'dBX3uq_ETMKMr57R8KdBEZ:APA91bGW-ljOAUJBk6urrw-0IfplE44XLKLoRIMLJvEap2gO2WcBis18LUiC4VBKv3-vVvmjcd8EKDVulwCtg4fcEsZ-Y5U0qL6dhGMDbU5UVs57cNDYR5c',
#     'c4uLjdAaSxaMktn9CtTdtm:APA91bGRDHHwUxfY5Oln2OH6E9B1-9RPso-jadaZLNsbVF6MytbjmEOYEQK1h-h39iyo63bekcAPPZA76_a_r-mxkeSxyiFO2jDQyHcm-Lr1kTQK4XyPZpE',
#     'fDL1EgYiQ-Sbjt64EQRkSI:APA91bHVgnM3VEnDNPZW2D4PUMG_a8oYLTxWHvImHpzg8f1yuLTrbwhCYpzuwcouWyGejs9zsk1B7vfCEyCzcZnug9dws-bcf80yxEP0C9QZwHSnH48fqp0',
#     'fqF3noPERQ2nLHn-AGctOI:APA91bEtsHw1c5nykIyVurh18KN5OfcKTv1ts539RjvvC_KSPcplCZLBUgTCJTBgmQJD9r3j7Ik7xs2gWfI7H7k0zZDMzPPmS1f1Gan6Qe-h_WAsBpJXnR8'
#   ],
#   isOnboarded: true,
#   createdAt: '2025-05-29T15:21:02.407Z',
#   updatedAt: '2025-06-03T05:15:54.688Z',
#   role: 'teacher',
#   email: 'rah@gmail.com',
#   name: 'dsa',
#   profileImage: 'https://storage.googleapis.com/srisridrishti-c1673.firebasestorage.app/profiles/68387b5e263c15997a62c736/1748539002358_30739bdc-4e10-4516-b0b0-03eb42470acb.jpg',
#   teacherRoleApproved: 'accepted',
#   userName: 'rahull32',
#   teacherId: 'ad',
#   teacherIdCard: 'https://storage.googleapis.com/srisridrishti-c1673.firebasestorage.app/teacher_ids/68387b5e263c15997a62c736/1748560678902_24a554db-f42b-4d10-a30f-4dd114008984.jpeg',
#   bio: '',
#   youtubeUrl: '',
#   xUrl: '',
#   instagramUrl: '',
#   nearByVisible: true,
#   locationSharing: true,
#   geometry: { type: 'Point', coordinates: [ -122.084, 37.4219983 ] }
# }
# info: GET /user 200 - 36.825 ms
# Auth middleware - Received headers: {
#   'user-agent': 'Dart/3.7 (dart:io)',
#   'content-type': 'application/json; charset=utf-8',
#   'accept-encoding': 'gzip',
#   'content-length': '66',
#   authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8',
#   host: '52.66.64.109:8080'
# }
# Auth middleware - Authorization header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Extracted token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Verified token payload: {
#   id: '68387b5e263c15997a62c736',
#   type: 'access',
#   iat: 1748670644,
#   exp: 1756446644
# }
# Mongoose: users.findOne({ _id: new ObjectId("68387b5e263c15997a62c736") }, {})
# Auth middleware - Found user: new ObjectId("68387b5e263c15997a62c736")
# { lat: '37.4219983', long: '-122.084', location: 'Regular update' }
# Mongoose: users.findOneAndUpdate({ _id: new ObjectId("68387b5e263c15997a62c736") }, { '$setOnInsert': { createdAt: new Date("Tue, 03 Jun 2025 16:06:34 GMT") }, '$set': { updatedAt: new Date("Tue, 03 Jun 2025 16:06:34 GMT"), geometry: { type: 'Point', coordinates: [ -122.084, 37.4219983 ] }, location: 'Regular update' }}, { runValidators: true, upsert: false, remove: false, returnDocument: 'after', returnOriginal: false})
# Auth middleware - Received headers: {
#   'user-agent': 'Dart/3.7 (dart:io)',
#   accept: 'application/json',
#   'accept-encoding': 'gzip',
#   'content-length': '82',
#   host: '52.66.64.109:8080',
#   authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8',
#   'content-type': 'application/json'
# }
# Auth middleware - Authorization header: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Extracted token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Verified token payload: {
#   id: '68387b5e263c15997a62c736',
#   type: 'access',
#   iat: 1748670644,
#   exp: 1756446644
# }
# Mongoose: users.findOne({ _id: new ObjectId("68387b5e263c15997a62c736") }, {})
# Auth middleware - Received headers: {
#   'user-agent': 'Dart/3.7 (dart:io)',
#   accept: 'application/json',
#   'accept-encoding': 'gzip',
#   'content-length': '82',
#   host: '52.66.64.109:8080',
#   authorization: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8',
#   'content-type': 'application/json'
# }
# Auth middleware - Authorization header: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Extracted token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Verified token payload: {
#   id: '68387b5e263c15997a62c736',
#   type: 'access',
#   iat: 1748670644,
#   exp: 1756446644
# }
# Mongoose: users.findOne({ _id: new ObjectId("68387b5e263c15997a62c736") }, {})
# info: PUT /user/location 200 - 52.545 ms
# Auth middleware - Found user: new ObjectId("68387b5e263c15997a62c736")
# Getting events with params: {
#   date: '2025-06-03T00:00:00.000Z',
#   lat: 37.4219983,
#   long: -122.084,
#   radius: 5000
# }
# user---------- { id: '68387b5e263c15997a62c736', role: 'teacher' }
# Date parameter received but not applying filtering: 2025-06-03T00:00:00.000Z
# Auth middleware - Found user: new ObjectId("68387b5e263c15997a62c736")
# Getting events with params: {
#   date: '2024-01-26T00:00:00.000Z',
#   lat: 37.4219983,
#   long: -122.084,
#   radius: 5000
# }
# user---------- { id: '68387b5e263c15997a62c736', role: 'teacher' }
# Date parameter received but not applying filtering: 2024-01-26T00:00:00.000Z
# Auth middleware - Received headers: {
#   'user-agent': 'Dart/3.7 (dart:io)',
#   'content-type': 'application/json',
#   'accept-encoding': 'gzip',
#   'content-length': '48',
#   host: '52.66.64.109:8080'
# }
# Auth middleware - Authorization header: undefined
# Mongoose: events.find({}, {})
# info: POST /event/nearEvent 200 - 14.630 ms
# [TIME-DEBUG] Current Time: {
#   originalTime: '2025-06-03T21:37:00+05:30',
#   utc: '2025-06-03T16:07:00Z',
#   unix: 1748966820
# }
# [TIME-DEBUG] UTC Query Window Start: {
#   originalTime: '2025-06-03T16:07:00Z',
#   utc: '2025-06-03T16:07:00Z',
#   unix: 1748966820
# }
# [TIME-DEBUG] UTC Query Window End: {
#   originalTime: '2025-06-03T16:12:00Z',
#   utc: '2025-06-03T16:12:00Z',
#   unix: 1748967120
# }
# Mongoose: notifications.find({ scheduledTime: { '$gte': new Date("Tue, 03 Jun 2025 16:07:00 GMT"), '$lte': new Date("Tue, 03 Jun 2025 16:12:00 GMT") }, status: 'pending', processed: false}, {})
# [TIME-DEBUG] Current Time: {
#   originalTime: '2025-06-03T21:37:00+05:30',
#   utc: '2025-06-03T16:07:00Z',
#   unix: 1748966820
# }
# [TIME-DEBUG] UTC Query Window Start: {
#   originalTime: '2025-06-03T16:07:00Z',
#   utc: '2025-06-03T16:07:00Z',
#   unix: 1748966820
# }
# [TIME-DEBUG] UTC Query Window End: {
#   originalTime: '2025-06-03T16:12:00Z',
#   utc: '2025-06-03T16:12:00Z',
#   unix: 1748967120
# }
# Mongoose: notifications.find({ scheduledTime: { '$gte': new Date("Tue, 03 Jun 2025 16:07:00 GMT"), '$lte': new Date("Tue, 03 Jun 2025 16:12:00 GMT") }, status: 'pending', processed: false}, {})
# Found 0 notifications to process
# Found 0 notifications to process
# Auth middleware - Received headers: {
#   'user-agent': 'Dart/3.7 (dart:io)',
#   'content-type': 'application/json; charset=utf-8',
#   'accept-encoding': 'gzip',
#   'content-length': '66',
#   authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8',
#   host: '52.66.64.109:8080'
# }
# Auth middleware - Authorization header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Extracted token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Verified token payload: {
#   id: '68387b5e263c15997a62c736',
#   type: 'access',
#   iat: 1748670644,
#   exp: 1756446644
# }
# Mongoose: users.findOne({ _id: new ObjectId("68387b5e263c15997a62c736") }, {})
# Auth middleware - Found user: new ObjectId("68387b5e263c15997a62c736")
# { lat: '37.4219983', long: '-122.084', location: 'Regular update' }
# Mongoose: users.findOneAndUpdate({ _id: new ObjectId("68387b5e263c15997a62c736") }, { '$setOnInsert': { createdAt: new Date("Tue, 03 Jun 2025 16:07:02 GMT") }, '$set': { updatedAt: new Date("Tue, 03 Jun 2025 16:07:02 GMT"), geometry: { type: 'Point', coordinates: [ -122.084, 37.4219983 ] }, location: 'Regular update' }}, { runValidators: true, upsert: false, remove: false, returnDocument: 'after', returnOriginal: false})
# info: PUT /user/location 200 - 17.944 ms
# Auth middleware - Received headers: {
#   'user-agent': 'Dart/3.7 (dart:io)',
#   'content-type': 'application/json; charset=utf-8',
#   'accept-encoding': 'gzip',
#   'content-length': '66',
#   authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8',
#   host: '52.66.64.109:8080'
# }
# Auth middleware - Authorization header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Extracted token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4Mzg3YjVlMjYzYzE1OTk3YTYyYzczNiIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NDg2NzA2NDQsImV4cCI6MTc1NjQ0NjY0NH0.J9MhvfwtW4_tWAeFS0yBRPEqyIch6Mk7pslYdlrDkV8
# Auth middleware - Verified token payload: {
#   id: '68387b5e263c15997a62c736',
#   type: 'access',
#   iat: 1748670644,
#   exp: 1756446644
# }
# Mongoose: users.findOne({ _id: new ObjectId("68387b5e263c15997a62c736") }, {})
# Auth middleware - Found user: new ObjectId("68387b5e263c15997a62c736")
# { lat: '37.4219983', long: '-122.084', location: 'Regular update' }
# Mongoose: users.findOneAndUpdate({ _id: new ObjectId("68387b5e263c15997a62c736") }, { '$setOnInsert': { createdAt: new Date("Tue, 03 Jun 2025 16:07:32 GMT") }, '$set': { updatedAt: new Date("Tue, 03 Jun 2025 16:07:32 GMT"), geometry: { type: 'Point', coordinates: [ -122.084, 37.4219983 ] }, location: 'Regular update' }}, { runValidators: true, upsert: false, remove: false, returnDocument: 'after', returnOriginal: false})
# info: PUT /user/location 200 - 19.953 ms
# info: POST /event/all-events?matchQuery= - - - ms
# info: POST /event/all-events?matchQuery= - - - ms
# [ec2-user@ip-172-31-13-181 Drishti_node]$