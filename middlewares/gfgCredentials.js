const injectGfgCredentials = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                message : "Unauthorized user.",
            })
        }

        req.body = req.body || {}
        req.body.handle = req.user.gfgId



        
        // req.user.gfgId

        req.headers.cookie = req.user.gfgCookie

        next()
    } catch (err) {
        console.error("[GFG Injector Error]:", err)
        res.status(500).json({ message: "Internal Server Error in GFG injector" })
    }
}

module.exports = injectGfgCredentials