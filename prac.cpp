#include<bits/stdc++.h>
using namespace std;
int main() {
    int n;
    cin >> n;
    vector<int> a(n);
    for (int i = 0;i < n;i++) {
        cin >> a[i];
    }
    
    map<int,int> mp;
    for (int i : a) {
        mp[i]++;
    }
    if (mp[-1] > mp[1]) {
        int x = (mp[-1] - mp[1])/2;
        mp[-1] = mp[-1] - x;
        mp[1] = mp[1] + x;
    }
    cout << mp[1] << " " << mp[-1] << endl;
}