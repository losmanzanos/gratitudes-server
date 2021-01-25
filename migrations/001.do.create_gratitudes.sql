CREATE TABLE gratitudes (
    id SERIAL PRIMARY KEY,
    thankful_for TEXT NOT NULL,
    did_well TEXT NOT NULL,
    achieve TEXT NOT NULL,
    soc TEXT,
    date_created TIMESTAMP DEFAULT now() NOT NULL
);