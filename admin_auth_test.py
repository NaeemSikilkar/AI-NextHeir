import requests
import sys
import json
from datetime import datetime

class AdminAuthTester:
    def __init__(self, base_url="https://heir-planner.preview.emergentagent.com"):
        self.base_url = base_url
        self.admin_session = requests.Session()
        self.user_session = requests.Session()
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, session=None):
        """Run a single API test"""
        if session is None:
            session = requests.Session()
            
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = session.get(url, headers=headers)
            elif method == 'POST':
                response = session.post(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"   Error: {error_detail}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_register_normal_user(self):
        """Test registering a normal user and verify stored fields"""
        timestamp = datetime.now().strftime('%H%M%S')
        test_email = f"testuser{timestamp}@example.com"
        test_name = f"Test User {timestamp}"
        test_password = "Test123!"
        
        success, response = self.run_test(
            "Register Normal User",
            "POST",
            "auth/register",
            200,
            data={
                "name": test_name,
                "email": test_email,
                "password": test_password
            },
            session=self.user_session
        )
        
        if success:
            # Verify response contains expected fields
            expected_fields = ['id', 'email', 'name', 'role']
            missing_fields = [field for field in expected_fields if field not in response]
            
            if missing_fields:
                print(f"   ❌ Missing fields in response: {missing_fields}")
                return False, None, None
            
            if response.get('role') != 'user':
                print(f"   ❌ Expected role 'user', got '{response.get('role')}'")
                return False, None, None
                
            if response.get('name') != test_name:
                print(f"   ❌ Expected name '{test_name}', got '{response.get('name')}'")
                return False, None, None
                
            if response.get('email') != test_email.lower():
                print(f"   ❌ Expected email '{test_email.lower()}', got '{response.get('email')}'")
                return False, None, None
                
            print(f"   ✅ User registered with correct fields: name, email, role=user")
            return True, test_email, test_password
        
        return False, None, None

    def test_admin_login(self):
        """Test admin login with sikilkarnaeem@gmail.com"""
        admin_email = "sikilkarnaeem@gmail.com"
        admin_password = "Admin123!"
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": admin_email,
                "password": admin_password
            },
            session=self.admin_session
        )
        
        if success:
            if response.get('role') != 'admin':
                print(f"   ❌ Expected role 'admin', got '{response.get('role')}'")
                return False
                
            print(f"   ✅ Admin login successful with role=admin")
            return True
        
        return False

    def test_normal_user_login(self, email, password):
        """Test normal user login"""
        success, response = self.run_test(
            "Normal User Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": email,
                "password": password
            },
            session=self.user_session
        )
        
        if success:
            if response.get('role') != 'user':
                print(f"   ❌ Expected role 'user', got '{response.get('role')}'")
                return False
                
            print(f"   ✅ Normal user login successful with role=user")
            return True
        
        return False

    def test_admin_get_users(self):
        """Test admin access to GET /api/admin/users"""
        success, response = self.run_test(
            "Admin Get Users",
            "GET",
            "admin/users",
            200,
            session=self.admin_session
        )
        
        if success:
            if not isinstance(response, list):
                print(f"   ❌ Expected list response, got {type(response)}")
                return False
                
            print(f"   ✅ Admin successfully retrieved {len(response)} users")
            
            # Verify user data structure
            if len(response) > 0:
                user = response[0]
                expected_fields = ['email', 'name', 'role', 'created_at']
                present_fields = [field for field in expected_fields if field in user]
                print(f"   User fields present: {present_fields}")
                
                # Check that password_hash is not included
                if 'password_hash' in user:
                    print(f"   ❌ password_hash should not be included in response")
                    return False
                else:
                    print(f"   ✅ password_hash correctly excluded from response")
            
            return True
        
        return False

    def test_user_get_users_forbidden(self):
        """Test that normal user gets 403 for GET /api/admin/users"""
        success, response = self.run_test(
            "User Get Users (Should Fail)",
            "GET",
            "admin/users",
            403,
            session=self.user_session
        )
        
        if success:
            print(f"   ✅ Normal user correctly denied access (403)")
            return True
        
        return False

    def test_unauthenticated_get_users(self):
        """Test that unauthenticated request gets 401 for GET /api/admin/users"""
        success, response = self.run_test(
            "Unauthenticated Get Users (Should Fail)",
            "GET",
            "admin/users",
            401,
            session=requests.Session()  # Fresh session without auth
        )
        
        if success:
            print(f"   ✅ Unauthenticated request correctly denied (401)")
            return True
        
        return False

def main():
    print("🚀 Starting Admin Authentication Testing")
    print("=" * 60)
    
    tester = AdminAuthTester()
    
    # Test 1: Register normal user
    success, user_email, user_password = tester.test_register_normal_user()
    if not success:
        print("❌ Normal user registration failed, stopping tests")
        return 1

    # Test 2: Admin login
    if not tester.test_admin_login():
        print("❌ Admin login failed, stopping tests")
        return 1

    # Test 3: Normal user login
    if not tester.test_normal_user_login(user_email, user_password):
        print("❌ Normal user login failed")

    # Test 4: Admin can access users endpoint
    if not tester.test_admin_get_users():
        print("❌ Admin access to users endpoint failed")

    # Test 5: Normal user gets 403 for users endpoint
    if not tester.test_user_get_users_forbidden():
        print("❌ Normal user should be denied access to users endpoint")

    # Test 6: Unauthenticated request gets 401
    if not tester.test_unauthenticated_get_users():
        print("❌ Unauthenticated request should be denied")

    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Tests completed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All admin authentication tests passed!")
        return 0
    else:
        print("⚠️  Some admin authentication tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())