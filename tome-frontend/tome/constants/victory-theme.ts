/**
 * Victory Native theme matching Tome design system
 * Eggshell white background with purple accents
 */

import { Colors, Fonts } from './theme';

export const tomeVictoryTheme = {
    axis: {
        style: {
            axis: {
                stroke: Colors.light.border,
                strokeWidth: 1
            },
            axisLabel: {
                fontFamily: Fonts.sans,
                fontSize: 12,
                fill: Colors.light.textSecondary,
                padding: 8
            },
            grid: {
                stroke: Colors.light.border,
                strokeDasharray: '4, 4',
                strokeWidth: 0.5
            },
            ticks: {
                stroke: Colors.light.border,
                strokeWidth: 1,
                size: 5
            },
            tickLabels: {
                fontFamily: Fonts.sans,
                fontSize: 11,
                fill: Colors.light.textSecondary,
                padding: 4
            }
        }
    },
    line: {
        style: {
            data: {
                stroke: Colors.light.primary,
                strokeWidth: 3
            },
            labels: {
                fontFamily: Fonts.serif,
                fontSize: 12,
                fill: Colors.light.text
            }
        }
    },
    bar: {
        style: {
            data: {
                fill: Colors.light.primary,
                width: 20
            },
            labels: {
                fontFamily: Fonts.serif,
                fontSize: 12,
                fill: Colors.light.text
            }
        }
    },
    pie: {
        style: {
            data: {
                padding: 8
            },
            labels: {
                fontFamily: Fonts.serif,
                fontSize: 13,
                fontWeight: '600',
                fill: Colors.light.text,
                padding: 10
            }
        },
        colorScale: [
            Colors.light.primary,
            Colors.light.primaryLight,
            Colors.light.primaryDark
        ]
    },
    chart: {
        padding: {
            top: 20,
            bottom: 40,
            left: 50,
            right: 20
        }
    }
};

// Dark theme variant
export const tomeVictoryThemeDark = {
    axis: {
        style: {
            axis: {
                stroke: Colors.dark.border,
                strokeWidth: 1
            },
            axisLabel: {
                fontFamily: Fonts.sans,
                fontSize: 12,
                fill: Colors.dark.textSecondary,
                padding: 8
            },
            grid: {
                stroke: Colors.dark.border,
                strokeDasharray: '4, 4',
                strokeWidth: 0.5
            },
            ticks: {
                stroke: Colors.dark.border,
                strokeWidth: 1,
                size: 5
            },
            tickLabels: {
                fontFamily: Fonts.sans,
                fontSize: 11,
                fill: Colors.dark.textSecondary,
                padding: 4
            }
        }
    },
    line: {
        style: {
            data: {
                stroke: Colors.dark.primary,
                strokeWidth: 3
            },
            labels: {
                fontFamily: Fonts.serif,
                fontSize: 12,
                fill: Colors.dark.text
            }
        }
    },
    bar: {
        style: {
            data: {
                fill: Colors.dark.primary,
                width: 20
            },
            labels: {
                fontFamily: Fonts.serif,
                fontSize: 12,
                fill: Colors.dark.text
            }
        }
    },
    pie: {
        style: {
            data: {
                padding: 8
            },
            labels: {
                fontFamily: Fonts.serif,
                fontSize: 13,
                fontWeight: '600',
                fill: Colors.dark.text,
                padding: 10
            }
        },
        colorScale: [
            Colors.dark.primary,
            Colors.dark.primaryLight,
            Colors.dark.primaryDark
        ]
    },
    chart: {
        padding: {
            top: 20,
            bottom: 40,
            left: 50,
            right: 20
        }
    }
};
