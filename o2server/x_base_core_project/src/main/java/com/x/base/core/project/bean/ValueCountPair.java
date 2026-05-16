package com.x.base.core.project.bean;

import java.io.Serializable;
import java.util.Objects;

public record ValueCountPair(Object value, Long count) implements Serializable {

    public ValueCountPair {
    }

    public ValueCountPair() {
        this(null, null);
    }

    @Override
    public int hashCode() {
        final int prime = 31;
        int result = 1;
        result = prime * result + ((count == null) ? 0 : count.hashCode());
        result = prime * result + ((value == null) ? 0 : value.hashCode());
        return result;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        ValueCountPair other = (ValueCountPair) obj;
        return (Objects.equals(this.count, other.count))
                && (Objects.equals(this.value, other.value));
    }
}
