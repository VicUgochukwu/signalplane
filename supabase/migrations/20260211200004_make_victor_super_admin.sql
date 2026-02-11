-- Make Victor a super_admin in the admin schema
INSERT INTO admin.user_profiles (id, role, display_name)
VALUES ('0b163eec-e356-4f90-918f-3758d435f907', 'super_admin', 'Victor Ugochukwu')
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
