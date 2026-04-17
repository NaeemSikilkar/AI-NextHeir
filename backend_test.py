import requests
import sys
import json
from datetime import datetime, timedelta

class AuthFeaturesTester:
    def __init__(self, base_url="https://heir-planner.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.session = requests.Session()  # Use session to maintain cookies
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.admin_email = "sikilkarnaeem@gmail.com"
        self.admin_password = "NextHeir@2026"

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, response_type="json"):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = self.session.get(url, headers=test_headers, params=data)
            elif method == 'POST':
                response = self.session.post(url, json=data, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response_type == "json":
                    try:
                        return True, response.json()
                    except:
                        return True, {}
                else:
                    return True, response.content
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json().get('detail', 'No detail')
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_admin_login(self):
        """Test admin login to get auth token"""
        print("\n=== ADMIN LOGIN TEST ===")
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": self.admin_email, "password": self.admin_password}
        )
        if success and 'id' in response:
            print(f"   Admin role: {response.get('role', 'unknown')}")
            return True
        return False

    def test_otp_flow(self):
        """Test OTP send and verify flow"""
        print("\n=== OTP FLOW TESTS ===")
        
        # Test OTP send
        phone = "9876543210"
        country_code = "+91"
        success, response = self.run_test(
            "Send OTP",
            "POST",
            "auth/otp/send",
            200,
            data={"phone": phone, "country_code": country_code}
        )
        
        if not success:
            return False
            
        simulated_otp = response.get('simulated_otp')
        if not simulated_otp:
            print("❌ No simulated_otp in response")
            self.failed_tests.append("Send OTP: No simulated_otp returned")
            return False
            
        print(f"   Simulated OTP: {simulated_otp}")
        
        # Test OTP verify
        success, response = self.run_test(
            "Verify OTP",
            "POST", 
            "auth/otp/verify",
            200,
            data={"phone": phone, "country_code": country_code, "otp": simulated_otp, "name": "Test User"}
        )
        
        if success and 'id' in response:
            print(f"   Created user ID: {response.get('id')}")
            print(f"   User phone: {response.get('phone')}")
            return True
        return False

    def test_forgot_password_flow(self):
        """Test forgot password and reset flow"""
        print("\n=== FORGOT PASSWORD FLOW TESTS ===")
        
        # First register a test user for password reset
        test_email = f"test_reset_{datetime.now().strftime('%H%M%S')}@example.com"
        success, _ = self.run_test(
            "Register Test User for Reset",
            "POST",
            "auth/register", 
            200,
            data={"name": "Test Reset User", "email": test_email, "password": "TestPass123"}
        )
        
        if not success:
            print("❌ Failed to create test user for password reset")
            return False
            
        # Test forgot password
        success, response = self.run_test(
            "Forgot Password",
            "POST",
            "auth/forgot-password",
            200,
            data={"email": test_email}
        )
        
        if not success:
            return False
            
        reset_link = response.get('simulated_reset_link')
        if not reset_link:
            print("❌ No simulated_reset_link in response")
            self.failed_tests.append("Forgot Password: No simulated_reset_link returned")
            return False
            
        print(f"   Reset link: {reset_link}")
        
        # Extract token from reset link
        try:
            token = reset_link.split('token=')[1]
            print(f"   Extracted token: {token[:20]}...")
        except:
            print("❌ Could not extract token from reset link")
            self.failed_tests.append("Forgot Password: Invalid reset link format")
            return False
            
        # Test reset password
        success, response = self.run_test(
            "Reset Password",
            "POST",
            "auth/reset-password",
            200,
            data={"token": token, "new_password": "NewTestPass123"}
        )
        
        if success:
            print("   Password reset successful")
            
            # Test login with new password
            success, _ = self.run_test(
                "Login with New Password",
                "POST",
                "auth/login",
                200,
                data={"email": test_email, "password": "NewTestPass123"}
            )
            return success
        return False

    def test_admin_excel_export(self):
        """Test admin Excel export with date range"""
        print("\n=== ADMIN EXCEL EXPORT TESTS ===")
        
        # Login as admin first
        if not self.test_admin_login():
            print("❌ Admin login failed, skipping Excel export test")
            return False
            
        # Test Excel export with date range
        from_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        till_date = datetime.now().strftime('%Y-%m-%d')
        
        success, content = self.run_test(
            "Excel Export with Date Range",
            "GET",
            "admin/users/export",
            200,
            data={"from_date": from_date, "till_date": till_date},
            response_type="binary"
        )
        
        if success:
            print(f"   Excel file size: {len(content)} bytes")
            # Check if it's actually an Excel file
            if content.startswith(b'PK'):  # Excel files start with PK
                print("   ✅ Valid Excel file format")
                return True
            else:
                print("   ❌ Invalid Excel file format")
                self.failed_tests.append("Excel Export: Invalid file format")
                return False
        return False

    def test_basic_auth_endpoints(self):
        """Test basic auth endpoints"""
        print("\n=== BASIC AUTH TESTS ===")
        
        # Test register
        test_email = f"test_basic_{datetime.now().strftime('%H%M%S')}@example.com"
        success, response = self.run_test(
            "Basic Register",
            "POST",
            "auth/register",
            200,
            data={"name": "Test Basic User", "email": test_email, "password": "TestPass123"}
        )
        
        if not success:
            return False
            
        # Test login
        success, response = self.run_test(
            "Basic Login",
            "POST", 
            "auth/login",
            200,
            data={"email": test_email, "password": "TestPass123"}
        )
        
        if success and 'id' in response:
            print(f"   User ID: {response.get('id')}")
            print(f"   User role: {response.get('role')}")
            return True
        return False

    def run_all_tests(self):
        """Run all authentication feature tests"""
        print("🚀 Starting Authentication Features Testing")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run all test suites
        test_results = {
            "basic_auth": self.test_basic_auth_endpoints(),
            "otp_flow": self.test_otp_flow(), 
            "forgot_password": self.test_forgot_password_flow(),
            "admin_excel": self.test_admin_excel_export()
        }
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        print("\n📋 Feature Results:")
        for feature, result in test_results.items():
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"  {feature}: {status}")
            
        if self.failed_tests:
            print("\n❌ Failed Tests:")
            for failure in self.failed_tests:
                print(f"  - {failure}")
                
        return self.tests_passed == self.tests_run

def main():
    tester = AuthFeaturesTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())