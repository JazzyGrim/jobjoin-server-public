module.exports = {
  apps : [{
    name   : "Project IDIM",
    script : "main.js",
    watch  : true,
    ignore_watch: 'public',
    watch_options: {
      followSymlinks: false
    },
    env: {
      "NODE_ENV": "dev"
    },
    env_production: {
      "NOVE_ENV": "prod"
    }
  }]
}
