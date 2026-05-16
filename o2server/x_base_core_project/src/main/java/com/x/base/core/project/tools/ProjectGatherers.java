package com.x.base.core.project.tools;

import java.util.HashSet;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Gatherer;

public final class ProjectGatherers {

	private ProjectGatherers() {
	}

	public static <T, K> Gatherer<T, ?, T> distinctByKey(Function<? super T, ? extends K> keyExtractor) {
		return Gatherer.of(() -> new HashSet<K>(), (Set<K> seen, T element, Gatherer.Downstream<? super T> downstream) -> {
			if (seen.add(keyExtractor.apply(element))) {
				downstream.push(element);
			}
			return true;
		}, (left, right) -> {
			left.addAll(right);
			return left;
		}, (Set<K> seen, Gatherer.Downstream<? super T> downstream) -> {
		});
	}

	public static <T> Gatherer<T, ?, T> distinctWithNullFilter(boolean ignoreNull) {
		return Gatherer.of(() -> new HashSet<T>(), (Set<T> seen, T element, Gatherer.Downstream<? super T> downstream) -> {
			if (ignoreNull && element == null) {
				return true;
			}
			if (seen.add(element)) {
				downstream.push(element);
			}
			return true;
		}, (left, right) -> {
			left.addAll(right);
			return left;
		}, (Set<T> seen, Gatherer.Downstream<? super T> downstream) -> {
		});
	}
}
