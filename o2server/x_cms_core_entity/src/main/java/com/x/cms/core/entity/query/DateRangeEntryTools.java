package com.x.cms.core.entity.query;

import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;

import com.x.cms.core.entity.Document;

public class DateRangeEntryTools {

	public static Predicate toDocumentPredicate(CriteriaBuilder cb, Root<Document> root, DateRangeEntry dateRangeEntry)
			throws Exception {
		if (null == dateRangeEntry || (!dateRangeEntry.available())) {
			return cb.conjunction();
		}
		switch (dateRangeEntry.getDateEffectType()) {
		case publish:
			return cb.between(root.get(Document.publishTime_FIELDNAME), dateRangeEntry.getStart(),
					dateRangeEntry.getCompleted());
		case create:
			return cb.between(root.get(Document.createTime_FIELDNAME), dateRangeEntry.getStart(),
					dateRangeEntry.getCompleted());
		default:
			return cb.conjunction();
		}
	}
}
