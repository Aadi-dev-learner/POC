//CODEFORCES RESPONSE
// {
//     "id": 325754848,
//     "contestId": 2112,
//     "creationTimeSeconds": 1750691818,
//     "relativeTimeSeconds": 2518,
//     "problem": {
    //         "contestId": 2112,
//         "index": "B",
//         "name": "Shrinking Array",
//         "type": "PROGRAMMING",
//         "tags": [
    //             "brute force",
//             "greedy"
//         ]
//     },
//     "author": {
//         "contestId": 2112,
//         "participantId": 213209217,
//         "members": [
    //             {
//                 "handle": "parth_sharma23"
//             }
//         ],
//         "participantType": "CONTESTANT",
//         "ghost": false,
//         "startTimeSeconds": 1750689300
//     },
//     "programmingLanguage": "C++20 (GCC 13-64)",
//     "verdict": "WRONG_ANSWER",
//     "testset": "TESTS",
//     "passedTestCount": 1,
//     "timeConsumedMillis": 46,
//     "memoryConsumedBytes": 102400
// },

//LEETCODE SUBMISSION RESPONSE
// {
//     "id": 1669882837,
//     "runtime": 0,
//     "runtimeDisplay": "N/A",
//     "runtimePercentile": null,
//     "runtimeDistribution": "{\"lang\": \"cpp\", \"distribution\": [[\"0\", 41.372], [\"1\", 8.1163], [\"2\", 8.935], [\"3\", 19.0839], [\"4\", 11.1864], [\"5\", 2.6537], [\"6\", 3.183]]}",
//     "memory": 16204000,
//     "memoryDisplay": "N/A",
//     "memoryPercentile": null,
//     "memoryDistribution": "{\"lang\": \"cpp\", \"distribution\": [[\"14800\", 0.0353], [\"14900\", 0.0988], [\"15000\", 0.3105], [\"15100\", 0.7622], [\"15200\", 1.4468], [\"15300\", 3.0983], [\"15400\", 4.4393], [\"15500\", 5.1733], [\"15600\", 5.992], [\"15700\", 6.5989], [\"15800\", 6.6342], [\"15900\", 5.0109], [\"16000\", 2.7595], [\"16100\", 2.3149], [\"16200\", 3.31], [\"16300\", 8.2786], [\"16400\", 13.219], [\"16500\", 12.9296], [\"16600\", 5.6179], [\"16700\", 2.6749], [\"16800\", 2.1667], [\"16900\", 1.4327], [\"17000\", 0.6634]]}",
//     "code": "/**\n * Definition for a binary tree node.\n * struct TreeNode {\n *     int val;\n *     TreeNode *left;\n *     TreeNode *right;\n *     TreeNode() : val(0), left(nullptr), right(nullptr) {}\n *     TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}\n *     TreeNode(int x, TreeNode *left, TreeNode *right) : val(x), left(left), right(right) {}\n * };\n */\nclass Solution {\npublic:\n    void traverse(TreeNode* root,map<int,vector<int>>& mp,int col) {\n        if (!root) return;\n\n        if (mp.find(col) == mp.end()) {\n            vector<int> temp;\n            temp.push_back(root->val);\n            mp[col] = temp;\n        }\n        else {\n            mp[col].push_back(root->val);\n        }\n        traverse(root->left,mp,col-1);\n        traverse(root->right,mp,col+1);\n    }\n    vector<vector<int>> verticalTraversal(TreeNode* root) {\n        map<int,vector<int>> mp;\n        vector<vector<int>> ans;\n        traverse(root,mp,0);\n\n        for (auto i : mp) {\n            vector<int> temp;\n            for (int j : i.second) {\n                temp.push_back(j);\n            }\n            sort(temp.begin(),temp.end());\n            ans.push_back(temp);\n        }\n        return ans;\n    }\n};",
//     "timestamp": 1750367907,
//     "statusCode": 11,
//     "user": {
//         "username": "dankparth",
//         "profile": {
//             "realName": "Parth Sharma",
//             "userAvatar": "https://assets.leetcode.com/users/dankparth/avatar_1633595023.png"
//         }
//     },
//     "lang": {
//         "name": "cpp",
//         "verboseName": "C++"
//     },
//     "question": {
//         "questionId": "1029",
//         "titleSlug": "vertical-order-traversal-of-a-binary-tree",
//         "hasFrontendPreview": false
//     },
//     "notes": "",
//     "flagType": "WHITE",
//     "topicTags": [],
//     "runtimeError": null,
//     "compileError": null,
//     "lastTestcase": "[3,1,4,0,2,2]",
//     "codeOutput": "[[0],[1],[2,2,3],[4]]",
//     "expectedOutput": "[[0],[1],[3,2,2],[4]]",
//     "totalCorrect": 14,
//     "totalTestcases": 34,
//     "fullCodeOutput": null,
//     "testDescriptions": null,
//     "testBodies": null,
//     "testInfo": null,
//     "stdOutput": ""
// }
//LEETCODE QUESTION DETAILS RESPONSE 
// {
//     "id": 1678667935,
//     "lang": "cpp",
//     "time": "2 hours, 7 minutes",
//     "timestamp": 1751054301000,
//     "statusDisplay": "Accepted",
//     "runtime": 100,
//     "url": "/submissions/detail/1678667935/",
//     "isPending": false,
//     "title": "Find Duplicate Subtrees",
//     "memory": 99.7,
//     "titleSlug": "find-duplicate-subtrees"
// },


function createResponse(platform) {    
    return {
        id : "",
        platform:platform,
        language : "",
        time : "",
        title : "",
        status : "",
    }
}

module.exports = createResponse ;