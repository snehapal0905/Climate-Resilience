CREATE TABLE "prediction_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"mode" text NOT NULL,
	"hazard" text NOT NULL,
	"reference_date" date NOT NULL,
	"label" text NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"model_version" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "regions" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"state" text NOT NULL,
	"census_code" text,
	"population" integer,
	"geom" geometry(MultiPolygon, 4326) NOT NULL,
	"ref_lat" double precision NOT NULL,
	"ref_lon" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "risk_predictions" (
	"run_id" integer NOT NULL,
	"region_id" text NOT NULL,
	"valid_for" date NOT NULL,
	"risk_score" real NOT NULL,
	"risk_level" text NOT NULL,
	"top_factors" jsonb NOT NULL,
	"features" jsonb NOT NULL,
	CONSTRAINT "risk_predictions_run_id_region_id_valid_for_pk" PRIMARY KEY("run_id","region_id","valid_for")
);
--> statement-breakpoint
CREATE TABLE "run_weather" (
	"run_id" integer NOT NULL,
	"region_id" text NOT NULL,
	"date" date NOT NULL,
	"precipitation_mm" real,
	"temperature_max_c" real,
	"river_discharge_m3s" real,
	"is_forecast" boolean NOT NULL,
	CONSTRAINT "run_weather_run_id_region_id_date_pk" PRIMARY KEY("run_id","region_id","date")
);
--> statement-breakpoint
ALTER TABLE "risk_predictions" ADD CONSTRAINT "risk_predictions_run_id_prediction_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."prediction_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "risk_predictions" ADD CONSTRAINT "risk_predictions_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_weather" ADD CONSTRAINT "run_weather_run_id_prediction_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."prediction_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "run_weather" ADD CONSTRAINT "run_weather_region_id_regions_id_fk" FOREIGN KEY ("region_id") REFERENCES "public"."regions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "regions_geom_idx" ON "regions" USING gist ("geom");--> statement-breakpoint
CREATE INDEX "risk_predictions_run_date_idx" ON "risk_predictions" USING btree ("run_id","valid_for");