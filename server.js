/*
Yuanwei Zhang - zhyu23xw@student.ju.se
Target grade: 5
Project Web Dev Fun - 2025
Administrator login: admin
Administrator password: "wdf#2025" ---> "$2b$12$p5.UuPb9Zh.siIc78Ie.Nu9eGx9d5OLT2pkecedig2P.6CdfL1ZUa"
*/

//--- LOAD THE PACKAGES
const express = require("express");
const { engine } = require("express-handlebars");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");

//--- DEFINE VARIABLES AND CONSTANTS
const port = 8080;
const app = express();

//--- DEFINE MIDDLEWARES
app.use(express.static("public"));

// Handlebars configuration
app.engine(
  "handlebars",
  engine({
    defaultLayout: "main",
    layoutsDir: "./views/layouts",
    helpers: {
      truncate: (text, length) => {
        if (text && text.length > length)
          return text.substring(0, length) + "...";
        return text;
      },
      gt: (a, b) => a > b,
      lt: (a, b) => a < b,
      eq: (a, b) => a === b,
      increment: (value) => parseInt(value) + 1,
      decrement: (value) => parseInt(value) - 1,
    },
  })
);
app.set("view engine", "handlebars");
app.set("views", "./views");

// Body parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// --- SESSION SETUP ---
app.use(
  session({
    secret: "mySecretKey",
    resave: false,
    saveUninitialized: true,
  })
);

// Pass session to handlebars
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

//--- CONNECT TO DATABASE
const dbPath = path.join(__dirname, "database", "blog.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) console.error("❌ Database connection error:", err);
  else console.log("✅ Connected to database:", dbPath);
});
//https://grok.com/share/bGVnYWN5LWNvcHk%3D_ced168e2-482c-4f2a-8c2e-c2bb21ca6ee1
// Create tables
db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user'
    )
  `);

  // Categories table
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT
    )
  `);

  // Posts table
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      image TEXT,
      category_id INTEGER,
      author TEXT NOT NULL, 
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    )
  `);

  // Comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER,
      commenter TEXT NOT NULL, 
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id)
    )
  `);
});
//https://chatgpt.com/share/68f83bad-0b0c-8007-8a98-310ad1ef8eb5
// --- Insert initial data（
db.serialize(() => {
  db.get("SELECT COUNT(*) AS count FROM users", (err, row) => {
    if (row.count === 0) {
      db.run(`
        INSERT INTO users (username, email, password, role) VALUES
        ('admin', 'admin@blog.com', '$2b$12$p5.UuPb9Zh.siIc78Ie.Nu9eGx9d5OLT2pkecedig2P.6CdfL1ZUa', 'admin')
      `);
      console.log("✅ Inserted admin user");
    }
  });

  db.get("SELECT COUNT(*) AS count FROM categories", (err, row) => {
    if (row.count === 0) {
      db.run(`
        INSERT INTO categories (name, description) VALUES
        ('Technology', 'Tech news and tutorials'),
        ('Lifestyle', 'Daily life and inspiration'),
        ('Art', 'Design and illustration works'),
        ('Travel', 'Stories from around the world'),
        ('Food', 'Tasty recipes and restaurant reviews')
      `);
      console.log("✅ Inserted default categories");
    }
  });

  // blog（author）
  db.get("SELECT COUNT(*) AS count FROM posts", (err, row) => {
    if (row.count === 0) {
      db.run(`
        INSERT INTO posts (title, content, category_id, author, image) VALUES
        ('The Language of Brushstrokes', 
         'Every stroke of the brush carries a whisper—of emotion, of intention, of the hand that guides it. Impressionists understood this: a single daub of cerulean can evoke an entire sea, while a smudge of burnt sienna might capture the weight of a summer sunset. It is not about precision, but about resonance. When I stand before a canvas, I do not paint what I see—I paint what I feel in the silence between heartbeats.', 
         3, 'Artisan', 'post1.jpg'), 

        ('In Praise of Imperfection', 
         'Wabi-sabi teaches us to find beauty in the incomplete, the worn, the transient. A chipped ceramic bowl, its glaze faded by time, holds more stories than a flawless one. In my studio, I leave edges unpolished, let paint bleed beyond lines, embrace the "mistakes" that reveal authenticity. Perfection is a mask—imperfection is a face. It is in the cracks that light gets in, after all.', 
         3, 'Philosopher', 'post2.jpg'),

        ('Colors as Memory Keepers', 
         'Cobalt blue will always smell like my grandmother’s attic—dust motes dancing in sunbeams, a faded quilt folded neatly on a trunk. Sage green takes me to the forest behind my childhood home, where moss clung to stones like secret-keepers. Artists do not merely use colors; we archive them. Each hue is a time capsule, waiting to unlock a moment long past when mixed on a palette or streaked across paper.', 
         3, 'Memoirist', 'post3.jpg'),

        ('The Poetry of Empty Spaces', 
         'Negative space is the unsung poet of design. It is the breath between words, the silence between notes, the pause that makes the melody sing. In my latest series, I’ve begun leaving vast swathes of canvas untouched—raw, unapologetic, full of potential. These empty spaces are not absence; they are presence. They invite the viewer to lean in, to fill the void with their own stories, making each encounter with the art uniquely theirs.', 
         3, 'Designer', 'post4.jpg'),

        ('When Creativity Feels Like a Stranger', 
         'There are days when the muse is a ghost. She lingers at the edge of the studio, just out of reach, her voice a faint echo. On these days, I do not fight the silence—I befriend it. I doodle aimlessly, walk through foggy parks, let my hands fold paper into shapes without purpose. Creativity is not a flame to be forced, but a tide to be waited for. And when it returns, as it always does, it brings gifts the hurry could never uncover.', 
         2, 'Writer', 'post5.jpg'),

        ('Art in the Mundane', 
         'I found a masterpiece in a cracked sidewalk yesterday—a mosaic of fallen cherry blossoms, their pink petals pressed into gray concrete by rain. Beauty is not reserved for galleries. It is in the way light slants through a kitchen window at 4 p.m., in the crumple of a well-loved book, in the accidental symmetry of a pile of autumn leaves. To be an artist is to see the extraordinary in the ordinary, to turn the mundane into a prayer of attention.', 
         2, 'Observer', 'post6.jpg'),

        ('The Rhythm of Creation', 
         'Painting is a dance—between control and surrender, intention and chance. Some days, I lead: mixing colors with purpose, sketching lines with certainty. Other days, the canvas leads: a smudge becomes a cloud, a drip becomes a river, a mistake becomes the heart of the piece. This back-and-forth is where magic lives. It is not about mastery, but about conversation—with the materials, with the moment, with the part of ourselves that knows more than our minds can explain.', 
         3, 'Artist', 'post7.jpg'),

        ('Why We Need Art in a Digital Age', 
         'In a world of pixels and algorithms, there is a hunger only a hand-painted canvas can satisfy. A digital image is perfect, reproducible, endless—but a physical work of art is finite, fragile, human. It bears the marks of its making: a fingerprint in the clay, a smudge of charcoal, a tear in the paper. These imperfections are proof of life, of a human being reaching out across time and space to say, "I was here. I felt something. Did you?"', 
         1, 'Technologist', 'post8.jpg'),

        ('Travels Through a Sketchbook', 
         'I never leave home without a sketchbook. It is not just a place to draw—it is a way of seeing. In Venice, I drew the way light fractured on canal water, turning it into liquid gold. In Marrakech, I sketched doorways, their intricate patterns telling stories of craftsmen long gone. These sketches are not accurate—they are emotional maps. They remind me that travel is not about covering ground, but about letting places seep into you, one line at a time.', 
         4, 'Wanderer', 'post9.jpg')
      `);
      console.log("✅ Inserted artistic sample posts");
    }
  });

  // comments（commenter）
  db.get(`SELECT COUNT(*) AS count FROM comments`, (err, row) => {
    if (row.count === 0) {
      db.run(`
  INSERT INTO comments (post_id, commenter, content) VALUES
  (1, 'ArtEnthusiast', 'The brushstroke metaphor is brilliant!'),
  (1, 'CreativeSoul', 'I feel exactly what you described here.'),
  (2, 'MinimalistFan', 'Wabi-sabi is such a beautiful concept.'),
  (2, 'DesignThinker', 'Imperfection is where the story lives.'),
  (3, 'ColorLover', 'Cobalt blue is my favorite too!'),
  (3, 'MemoryKeeper', 'Colors really do hold memories, don''t they?'), 
  (4, 'SpaceDesigner', 'Negative space is so underrated.'),
  (5, 'WriterGuy', 'I struggle with this too—glad I''m not alone.'),
  (6, 'EverydayObserver', 'I never noticed mundane beauty before.'),
  (9, 'TravelBug', 'Your sketchbook approach is genius!')
`);
      console.log("✅ Inserted expanded sample comments");
    }
  });
});

// --- ROUTE MIDDLEWARE ---
// Admin authentication middleware
function requireAdmin(req, res, next) {
  if (req.session && req.session.isLoggedIn && req.session.role === "admin") {
    return next();
  }
  return res.redirect("/");
}
//https://chatgpt.com/share/68f83a47-3a1c-8007-b4a9-64d1ffce7c49
// --- PUBLIC ROUTES ---
// Home page
app.get("/", (req, res) => {
  console.log("*** HOME route called ***");
  const sql = `
    SELECT posts.id, posts.title, posts.content, posts.image,
           posts.author,
           categories.name AS category, posts.created_at
    FROM posts
    INNER JOIN categories ON posts.category_id = categories.id 
    ORDER BY posts.created_at DESC
    LIMIT 3
  `;
  db.all(sql, (err, rows) => {
    if (err) {
      console.error("❌ Database error:", err);
      res.status(500).send("Database error");
    } else {
      res.render("home", { title: "Home", posts: rows });
    }
  });
});

// Blog List Page with pagination
app.get("/list", (req, res) => {
  const postsPerPage = 3;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * postsPerPage;

  // Get total posts count
  db.get(`SELECT COUNT(*) AS count FROM posts`, (err, countResult) => {
    if (err) {
      console.error("❌ Count error:", err);
      return res.status(500).send("Database error");
    }

    const totalPosts = countResult.count;
    const totalPages = Math.ceil(totalPosts / postsPerPage);

    // Get posts for current page
    const sql = `
      SELECT posts.id, posts.title, posts.image, posts.created_at,
             posts.author, 
             categories.name AS category
      FROM posts
      INNER JOIN categories ON posts.category_id = categories.id
      ORDER BY posts.created_at DESC
      LIMIT ? OFFSET ?
    `;

    db.all(sql, [postsPerPage, offset], (err, rows) => {
      if (err) {
        console.error("❌ Database error:", err);
        res.status(500).send("Database error");
      } else {
        res.render("list", {
          title: "Blog Posts",
          posts: rows,
          currentPage: page,
          totalPages: totalPages,
        });
      }
    });
  });
});

// Single Post Page
app.get("/post/:id", (req, res) => {
  const postId = req.params.id;
  const postSql = `
    SELECT posts.*, 
           categories.name AS category
    FROM posts
    INNER JOIN categories ON posts.category_id = categories.id  
    WHERE posts.id = ?
  `;

  db.get(postSql, [postId], (err, post) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).send("Database error");
    }
    if (!post) {
      return res.status(404).send("Post not found");
    }

    // comments query
    const commentSql = `
      SELECT * FROM comments
      WHERE post_id = ?
      ORDER BY created_at DESC
    `;

    db.all(commentSql, [postId], (err, comments) => {
      if (err) {
        console.error("❌ Comments query error:", err);
        return res.status(500).send("Database error");
      }
      res.render("post", {
        title: post.title,
        post,
        comments: comments || [],
      });
    });
  });
});

// Login Page
app.get("/login", (req, res) => {
  res.render("login", { title: "Login" });
});

// Login submission
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  db.get(sql, [username], async (err, user) => {
    if (err) {
      console.error("❌ Database error:", err);
      res.status(500).send("Database error");
    } else if (!user) {
      res.render("login", { title: "Login", error: "User not found" });
    } else {
      const match = await bcrypt.compare(password, user.password);
      if (match) {
        req.session.isLoggedIn = true;
        req.session.username = user.username;
        req.session.role = user.role;
        res.redirect("/admin");
      } else {
        res.render("login", { title: "Login", error: "Wrong password" });
      }
    }
  });
});

// Register Page
app.get("/register", (req, res) => {
  res.render("register", { title: "Register" });
});

// Register submission
app.post("/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.render("register", {
      title: "Register",
      error: "All fields are required",
    });
  }

  // Check if username/email exists
  const checkSql = "SELECT * FROM users WHERE username = ? OR email = ?";
  db.get(checkSql, [username, email], async (err, user) => {
    if (err) {
      console.error("❌ Database error:", err);
      return res.status(500).send("Database error");
    }

    if (user) {
      return res.render("register", {
        title: "Register",
        error: "Username or email already exists",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    const insertSql =
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, 'user')";
    db.run(insertSql, [username, email, hashedPassword], (err) => {
      if (err) {
        console.error("❌ Insert error:", err);
        res.status(500).send("Database insert error");
      } else {
        console.log(`✅ Registered new user: ${username}`);
        res.render("login", {
          title: "Login",
          message: "Registration successful! Please log in.",
        });
      }
    });
  });
});

// comment submission
app.post("/post/:id/comment", (req, res) => {
  const postId = req.params.id;
  const { commenter, content } = req.body;

  // check inputs
  if (!commenter || !content) {
    return res.redirect(`/post/${postId}`);
  }

  // comment insert
  const sql = `
    INSERT INTO comments (post_id, commenter, content)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [postId, commenter, content], (err) => {
    if (err) {
      console.error("❌ Comment insert error:", err);
      return res.status(500).send("Database error");
    }
    res.redirect(`/post/${postId}`);
  });
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// About Page
app.get("/aboutus", (req, res) => {
  res.render("aboutus", { title: "About Us" });
});

// Update Email Page
app.get("/update", (req, res) => {
  res.render("update", { title: "Update Email" });
});

// Update Email submission
app.post("/update", (req, res) => {
  const { username, email } = req.body;

  if (!username || !email) {
    return res.render("update", { error: "All fields are required." });
  }

  const sql = "UPDATE users SET email = ? WHERE username = ?";
  db.run(sql, [email, username], function (err) {
    if (err) {
      console.error("❌ Update error:", err);
      return res.render("update", { error: "Database error occurred." });
    }

    if (this.changes === 0) {
      return res.render("update", { error: "User not found." });
    }

    res.render("update", { message: "Email updated successfully!" });
  });
});

// Contact Page
app.get("/contact", (req, res) => {
  res.render("contact", { title: "Contact Us" });
});

// --- ADMIN ROUTES ---
// Admin Dashboard
app.get("/admin", requireAdmin, (req, res) => {
  const sql = `SELECT id, username, email, role FROM users ORDER BY id ASC`;
  db.all(sql, (err, users) => {
    if (err) {
      console.error(err);
      return res.render("admin", {
        title: "Admin Dashboard",
        users: [],
        error: "DB error",
      });
    }
    res.render("admin", {
      title: "Admin Dashboard",
      users,
      username: req.session.username,
    });
  });
});

// Add User (GET)
app.get("/admin/add-user", requireAdmin, (req, res) => {
  res.render("admin-add", { title: "Add New User" });
});

// Add User (POST)
app.post("/admin/add-user", requireAdmin, (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password) {
    return res.render("admin-add", {
      title: "Add User",
      error: "All fields are required",
    });
  }

  bcrypt.hash(password, 12, (err, hash) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error hashing password");
    }
    const sql =
      "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)";
    db.run(sql, [username, email, hash, role || "user"], (err) => {
      if (err) {
        console.error(err);
        res.render("admin-add", {
          title: "Add User",
          error: "Database error or duplicate username/email.",
        });
      } else {
        res.redirect("/admin");
      }
    });
  });
});

// Edit User (GET)
app.get("/admin/edit-user/:id", requireAdmin, (req, res) => {
  const sql = "SELECT * FROM users WHERE id = ?";
  db.get(sql, [req.params.id], (err, user) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
    if (!user) {
      return res.status(404).send("User not found");
    }
    res.render("admin-edit", { title: "Edit User", user });
  });
});

// Edit User (POST)
app.post("/admin/edit-user/:id", requireAdmin, (req, res) => {
  const { username, email, role } = req.body;
  const sql = "UPDATE users SET username=?, email=?, role=? WHERE id=?";
  db.run(sql, [username, email, role, req.params.id], (err) => {
    if (err) {
      console.error(err);
      res.status(500).send("Database error");
    } else {
      res.redirect("/admin");
    }
  });
});

// Delete User
app.get("/admin/delete-user/:id", requireAdmin, (req, res) => {
  const sql = "DELETE FROM users WHERE id = ?";
  db.run(sql, [req.params.id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Database error");
    }
    res.redirect("/admin");
  });
});

// --- ERROR HANDLING ---
// 404 page
app.use((req, res) => {
  res.status(404).render("404");
});

//--- START SERVER
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
