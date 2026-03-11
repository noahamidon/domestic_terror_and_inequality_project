## Author: Noah Amidon
## Purpose: Data Cleaning for QSS 19, Independent Project 1

library(tidyverse)
library(readxl)

gtd <- read_xlsx(file.choose())
glimpse(gtd)

clean <- gtd %>%
  select(c("iyear", 
           "country_txt", 
           "attacktype1_txt", 
           "targtype1_txt", 
           "nkill", 
           "INT_LOG")) %>%
  filter(INT_LOG == 0)

events <- clean %>%
  group_by(country_txt) %>%
  summarise(total_events = n(),
            total_deaths = sum(nkill, na.rm = TRUE),
            .groups = "drop")

countz <- clean %>%
  count(country_txt,               # grouping variable
        attacktype1_txt,           # attack type to be counted
        name = "events") %>%      # column that holds the count
  group_by(country_txt) %>%
  arrange(country_txt, desc(events)) %>%   # biggest → smallest
  # Keep the 5 most frequent attack types per country
  slice_max(order_by = events, n = 5, with_ties = FALSE) %>% 
  # Add a rank (1 = most common, 2 = second most, …)
  mutate(rank = row_number()) %>%
  ungroup() %>%
  pivot_wider(
    id_cols = country_txt,
    names_from = rank,
    values_from = c(attacktype1_txt, events),
    names_glue = "attack_{rank}_{.value}"
  ) %>%
  rename(
    attack_1_type   = attack_1_attacktype1_txt,
    attack_1_events = attack_1_events,
    attack_2_type   = attack_2_attacktype1_txt,
    attack_2_events = attack_2_events,
    attack_3_type   = attack_3_attacktype1_txt,
    attack_3_events = attack_3_events,
    attack_4_type   = attack_4_attacktype1_txt,
    attack_4_events = attack_4_events,
    attack_5_type   = attack_5_attacktype1_txt,
    attack_5_events = attack_5_events)

final <- events %>%
  left_join(countz, by = "country_txt")

#write_csv(final, "processed_gtd.csv")

wiid <- read.csv(file.choose())

gtd %>% glimpse()
terror <- gtd %>% 
  filter(INT_LOG == 0) %>%
  select(c("iyear", "country_txt", "nkill")) %>%
  group_by(country_txt, iyear) %>%
  summarize(tot_events = n(),
            tot_deaths = sum(nkill),
            .groups = "drop")

wiid %>% glimpse()

ginis <- wiid %>% 
  select(c("year", "country", "gini", "region_un", "population")) %>%
  group_by(year, country, region_un) %>%
  summarize(gini = mean(gini, na.rm = TRUE),
            population = median(population, na.rm = TRUE),
            .groups = "drop")

final2 <- terror %>%
  left_join(ginis, by = c(
    "iyear" = "year",
    "country_txt" = "country"
  )) %>%
  drop_na()
 

write_csv(final2, "processed_wiidgtd.csv")
  
