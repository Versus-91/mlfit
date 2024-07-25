library(plotly)
library(GGally)
library(ggplot2)
library(jsonlite)

setwd("...")

function(msg = "") {
  list(msg = paste0("The message is: '", msg, "'"))
}

#* Plot out data from the iris dataset
#* @param body:object
#* @post /plot
#* Request Body

function(req) {
  # Prepare example dataset
  data <- fromJSON(txt = req$postBody) %>% as.data.frame()
  data$species <- as.factor(data$species)
  str(data)
  summary(data)
  # Define custom function for KDE on the diagonal for numerical variables
  kde_diag <- function(data, mapping, ...) {
    if (is.numeric(data[[as_label(mapping$x)]])) {
      ggally_densityDiag(data, mapping, ...)
    } else {
      ggally_barDiag(data, mapping, ...)
    }
  }

  # Define custom function for KDE in the lower panels for numerical variables
  kde_lower <- function(data, mapping, ...) {
    if (is.numeric(data[[as_label(mapping$x)]]) &&
      is.numeric(data[[as_label(mapping$y)]])) {
      ggplot(data, mapping) +
        geom_density2d_filled(alpha = 0.5) +
        theme_bw()
    } else {
      ggplot(data, mapping) +
        geom_point(alpha = 0.5, aes(color = species)) +
        theme_bw()
    }
  }

  # Define custom function for the lower panels
  custom_lower <- function(data, mapping, ...) {
    ggplot(data, mapping) +
      geom_point(alpha = 0.5, aes(color = species)) +
      theme_bw()
  }

  # Create scatterplot matrix
  p <- ggpairs(data,
    aes(color = species), # Color points by species
    diag = list(
      continuous = kde_diag,
      discrete = kde_diag
    ),
    lower = list(
      continuous = custom_lower,
      combo = kde_lower
    ),
    upper = list(
      continuous = wrap("cor")
    )
  )
  plotly_json(p, pretty = FALSE)
}
